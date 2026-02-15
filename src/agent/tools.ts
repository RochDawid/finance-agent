import { tool } from "ai";
import { z } from "zod";

import { computeTechnicalAnalysis } from "../analysis/indicators.js";
import { computeLevelAnalysis } from "../analysis/levels.js";
import { formatReportForAgent } from "../analysis/scanner.js";
import { computeVolumeAnalysis } from "../analysis/volume.js";
import { fetchCryptoOHLC, fetchCryptoPrice } from "../data/coingecko.js";
import { fetchSentimentData, getSentimentSummary } from "../data/sentiment.js";
import { fetchOHLCV, fetchQuote } from "../data/yahoo.js";
import type { AssetType, OHLCV, Quote, Timeframe } from "../types/index.js";

export const tradingTools = {
  get_stock_data: tool({
    description:
      "Fetch OHLCV price data for a stock or ETF at a given timeframe. Returns open, high, low, close, volume bars plus current quote.",
    inputSchema: z.object({
      ticker: z.string().describe("Stock/ETF ticker symbol, e.g. AAPL, SPY"),
      timeframe: z
        .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
        .default("1d")
        .describe("Candle timeframe"),
    }),
    execute: async ({ ticker, timeframe }) => {
      const [data, quote] = await Promise.all([
        fetchOHLCV(ticker, timeframe as Timeframe),
        fetchQuote(ticker),
      ]);
      return {
        ticker,
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
    },
  }),

  get_crypto_data: tool({
    description:
      "Fetch cryptocurrency price, volume, and OHLC data from CoinGecko.",
    inputSchema: z.object({
      coinId: z
        .string()
        .describe("CoinGecko coin ID, e.g. bitcoin, ethereum, solana"),
      days: z
        .number()
        .default(30)
        .describe("Number of days of historical data (max 30)"),
    }),
    execute: async ({ coinId, days }) => {
      const [quote, ohlc] = await Promise.all([
        fetchCryptoPrice(coinId),
        fetchCryptoOHLC(coinId, Math.min(days, 30) as 1 | 7 | 14 | 30),
      ]);
      return {
        coinId,
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
    },
  }),

  analyze_technicals: tool({
    description:
      "Run full technical analysis on a ticker: trend (EMA, MACD, ADX), momentum (RSI, Stochastic, CCI), volatility (BB, ATR, Keltner), and volume (OBV, VWAP, CMF). Returns structured analysis with bias interpretations.",
    inputSchema: z.object({
      ticker: z.string().describe("Ticker symbol or CoinGecko coin ID"),
      timeframe: z
        .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
        .default("1d")
        .describe("Analysis timeframe"),
      assetType: z
        .enum(["stock", "etf", "crypto"])
        .default("stock")
        .describe("Type of asset"),
    }),
    execute: async ({ ticker, timeframe, assetType }) => {
      let data: OHLCV[];
      let quote: Quote;

      if (assetType === "crypto") {
        [quote, data] = await Promise.all([
          fetchCryptoPrice(ticker),
          fetchCryptoOHLC(ticker, 30),
        ]);
      } else {
        [quote, data] = await Promise.all([
          fetchQuote(ticker),
          fetchOHLCV(ticker, timeframe as Timeframe),
        ]);
      }

      if (data.length < 50) {
        return { error: `Insufficient data: only ${data.length} bars (need 50+)` };
      }

      const technicals = computeTechnicalAnalysis(ticker, data, timeframe as Timeframe);
      const levels = computeLevelAnalysis(ticker, data);
      const volAnalysis = computeVolumeAnalysis(data);

      const report = formatReportForAgent({
        ticker,
        assetType: assetType as AssetType,
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

      return {
        analysis: report,
        volumeProfile: {
          pointOfControl: volAnalysis.pointOfControl.toFixed(2),
          valueAreaLow: volAnalysis.valueAreaLow.toFixed(2),
          valueAreaHigh: volAnalysis.valueAreaHigh.toFixed(2),
          currentVsAvg: volAnalysis.currentVsAvg.toFixed(2) + "x",
          volumeTrend: volAnalysis.volumeTrend,
        },
      };
    },
  }),

  get_sentiment: tool({
    description:
      "Fetch market sentiment data: Crypto Fear & Greed Index and market breadth indicators.",
    inputSchema: z.object({}),
    execute: async () => {
      const sentiment = await fetchSentimentData();
      return {
        summary: getSentimentSummary(sentiment),
        raw: sentiment,
      };
    },
  }),

  get_support_resistance: tool({
    description:
      "Calculate key price levels: support/resistance from price action, Fibonacci retracements, and pivot points (classic and Camarilla).",
    inputSchema: z.object({
      ticker: z.string().describe("Ticker symbol or CoinGecko coin ID"),
      timeframe: z
        .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
        .default("1d")
        .describe("Timeframe for level calculation"),
      assetType: z
        .enum(["stock", "etf", "crypto"])
        .default("stock")
        .describe("Type of asset"),
    }),
    execute: async ({ ticker, timeframe, assetType }) => {
      const data: OHLCV[] =
        assetType === "crypto"
          ? await fetchCryptoOHLC(ticker, 30)
          : await fetchOHLCV(ticker, timeframe as Timeframe);

      if (data.length < 10) {
        return { error: "Insufficient data for level analysis" };
      }

      const levels = computeLevelAnalysis(ticker, data);
      const currentPrice = data[data.length - 1]?.close;

      if (!currentPrice) {
        return { error: "Insufficient data for level analysis" };
      }

      return {
        ticker,
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
    },
  }),
};
