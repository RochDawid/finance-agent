import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod/v4";
import { fetchOHLCV, fetchQuote } from "../data/yahoo.js";
import { fetchCryptoPrice, fetchCryptoOHLC } from "../data/coingecko.js";
import { computeTechnicalAnalysis } from "../analysis/indicators.js";
import { computeLevelAnalysis } from "../analysis/levels.js";
import { computeVolumeAnalysis } from "../analysis/volume.js";
import { fetchSentimentData, getSentimentSummary } from "../data/sentiment.js";
import { formatReportForAgent } from "../analysis/scanner.js";
import type { Timeframe, AssetType, OHLCV, Quote, TechnicalAnalysis, LevelAnalysis } from "../types/index.js";

const getStockData = tool(
  "get_stock_data",
  "Fetch OHLCV price data for a stock or ETF at a given timeframe. Returns open, high, low, close, volume bars.",
  {
    ticker: z.string().describe("Stock/ETF ticker symbol, e.g. AAPL, SPY"),
    timeframe: z
      .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
      .default("1d")
      .describe("Candle timeframe"),
  },
  async (args) => {
    try {
      const data = await fetchOHLCV(args.ticker, args.timeframe as Timeframe);
      const quote = await fetchQuote(args.ticker);
      const summary = {
        ticker: args.ticker,
        currentPrice: quote.price,
        change: quote.changePercent.toFixed(2) + "%",
        volume: quote.volume,
        avgVolume: quote.avgVolume,
        bars: data.length,
        lastBar: data[data.length - 1],
        recentBars: data.slice(-5).map((d) => ({
          date: d.timestamp.toISOString().split("T")[0],
          O: d.open.toFixed(2),
          H: d.high.toFixed(2),
          L: d.low.toFixed(2),
          C: d.close.toFixed(2),
          V: d.volume,
        })),
      };
      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error fetching stock data: ${err}` }],
        isError: true,
      };
    }
  },
  { annotations: { readOnly: true, openWorld: true } },
);

const getCryptoData = tool(
  "get_crypto_data",
  "Fetch cryptocurrency price, volume, and OHLC data. Uses CoinGecko API.",
  {
    coinId: z.string().describe("CoinGecko coin ID, e.g. bitcoin, ethereum, solana"),
    days: z.number().default(30).describe("Number of days of historical data"),
  },
  async (args) => {
    try {
      const [quote, ohlc] = await Promise.all([
        fetchCryptoPrice(args.coinId),
        fetchCryptoOHLC(args.coinId, Math.min(args.days, 30) as 1 | 7 | 14 | 30),
      ]);
      const summary = {
        coinId: args.coinId,
        currentPrice: quote.price,
        change24h: quote.changePercent.toFixed(2) + "%",
        volume24h: quote.volume,
        marketCap: quote.marketCap,
        bars: ohlc.length,
        recentBars: ohlc.slice(-5).map((d) => ({
          date: d.timestamp.toISOString().split("T")[0],
          O: d.open.toFixed(2),
          H: d.high.toFixed(2),
          L: d.low.toFixed(2),
          C: d.close.toFixed(2),
        })),
      };
      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error fetching crypto data: ${err}` }],
        isError: true,
      };
    }
  },
  { annotations: { readOnly: true, openWorld: true } },
);

const analyzeTechnicals = tool(
  "analyze_technicals",
  "Run full technical analysis on a ticker: trend (EMA, MACD, ADX), momentum (RSI, Stochastic, CCI), volatility (BB, ATR, Keltner), and volume (OBV, VWAP, CMF). Returns structured analysis with bias interpretations.",
  {
    ticker: z.string().describe("Ticker symbol or CoinGecko coin ID"),
    timeframe: z
      .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
      .default("1d")
      .describe("Analysis timeframe"),
    assetType: z
      .enum(["stock", "etf", "crypto"])
      .default("stock")
      .describe("Type of asset"),
  },
  async (args) => {
    try {
      let data: OHLCV[];
      let quote: Quote;

      if (args.assetType === "crypto") {
        [quote, data] = await Promise.all([
          fetchCryptoPrice(args.ticker),
          fetchCryptoOHLC(args.ticker, 30),
        ]);
      } else {
        [quote, data] = await Promise.all([
          fetchQuote(args.ticker),
          fetchOHLCV(args.ticker, args.timeframe as Timeframe),
        ]);
      }

      if (data.length < 50) {
        return {
          content: [{ type: "text", text: `Insufficient data: only ${data.length} bars (need 50+)` }],
          isError: true,
        };
      }

      const technicals = computeTechnicalAnalysis(
        args.ticker,
        data,
        args.timeframe as Timeframe,
      );
      const levels = computeLevelAnalysis(args.ticker, data);
      const volAnalysis = computeVolumeAnalysis(data);

      const report = formatReportForAgent({
        ticker: args.ticker,
        assetType: args.assetType as AssetType,
        quote,
        technicals,
        levels,
        marketCondition: {
          regime: "range_bound",
          sp500Change: 0,
          nasdaqChange: 0,
          sentiment: {
            fearGreed: { value: 50, classification: "Neutral", timestamp: new Date() },
          },
          timestamp: new Date(),
        },
        timestamp: new Date(),
      });

      const volumeInfo = `\n\n--- Volume Profile ---\nPoint of Control: $${volAnalysis.pointOfControl.toFixed(2)}\nValue Area: $${volAnalysis.valueAreaLow.toFixed(2)} - $${volAnalysis.valueAreaHigh.toFixed(2)}\nCurrent vs Avg Volume: ${volAnalysis.currentVsAvg.toFixed(2)}x\nVolume Trend: ${volAnalysis.volumeTrend}`;

      return { content: [{ type: "text", text: report + volumeInfo }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error analyzing technicals: ${err}` }],
        isError: true,
      };
    }
  },
  { annotations: { readOnly: true } },
);

const getSentiment = tool(
  "get_sentiment",
  "Fetch market sentiment data: Crypto Fear & Greed Index and market breadth indicators.",
  {},
  async () => {
    try {
      const sentiment = await fetchSentimentData();
      const summary = getSentimentSummary(sentiment);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { summary, raw: sentiment },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error fetching sentiment: ${err}` }],
        isError: true,
      };
    }
  },
  { annotations: { readOnly: true, openWorld: true } },
);

const getSupportResistance = tool(
  "get_support_resistance",
  "Calculate key price levels: support/resistance from price action, Fibonacci retracements, and pivot points (classic and Camarilla).",
  {
    ticker: z.string().describe("Ticker symbol or CoinGecko coin ID"),
    timeframe: z
      .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
      .default("1d")
      .describe("Timeframe for level calculation"),
    assetType: z
      .enum(["stock", "etf", "crypto"])
      .default("stock")
      .describe("Type of asset"),
  },
  async (args) => {
    try {
      let data: OHLCV[];

      if (args.assetType === "crypto") {
        data = await fetchCryptoOHLC(args.ticker, 30);
      } else {
        data = await fetchOHLCV(args.ticker, args.timeframe as Timeframe);
      }

      if (data.length < 10) {
        return {
          content: [{ type: "text", text: `Insufficient data for level analysis` }],
          isError: true,
        };
      }

      const levels = computeLevelAnalysis(args.ticker, data);
      const currentPrice = data[data.length - 1].close;

      const result = {
        ticker: args.ticker,
        currentPrice: currentPrice.toFixed(2),
        nearestSupport: levels.nearestSupport.toFixed(2),
        nearestResistance: levels.nearestResistance.toFixed(2),
        fibonacci: {
          "23.6%": levels.fibonacci.level236.toFixed(2),
          "38.2%": levels.fibonacci.level382.toFixed(2),
          "50.0%": levels.fibonacci.level500.toFixed(2),
          "61.8%": levels.fibonacci.level618.toFixed(2),
          "78.6%": levels.fibonacci.level786.toFixed(2),
        },
        pivots: {
          type: levels.pivots.type,
          PP: levels.pivots.pivot.toFixed(2),
          R1: levels.pivots.r1.toFixed(2),
          R2: levels.pivots.r2.toFixed(2),
          R3: levels.pivots.r3.toFixed(2),
          S1: levels.pivots.s1.toFixed(2),
          S2: levels.pivots.s2.toFixed(2),
          S3: levels.pivots.s3.toFixed(2),
        },
        keySupports: levels.supports.slice(0, 5).map((s) => ({
          price: s.price.toFixed(2),
          strength: s.strength,
          source: s.source,
        })),
        keyResistances: levels.resistances.slice(0, 5).map((r) => ({
          price: r.price.toFixed(2),
          strength: r.strength,
          source: r.source,
        })),
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error calculating levels: ${err}` }],
        isError: true,
      };
    }
  },
  { annotations: { readOnly: true } },
);

export const tradingTools = [
  getStockData,
  getCryptoData,
  analyzeTechnicals,
  getSentiment,
  getSupportResistance,
];

export function createTradingMcpServer() {
  return createSdkMcpServer({
    name: "finance-agent-tools",
    version: "1.0.0",
    tools: tradingTools,
  });
}
