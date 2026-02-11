import { fetchOHLCV, fetchQuote } from "../data/yahoo.js";
import { fetchCryptoPrice, fetchCryptoOHLC } from "../data/coingecko.js";
import { computeTechnicalAnalysis } from "./indicators.js";
import { computeLevelAnalysis } from "./levels.js";
import { computeVolumeAnalysis, type VolumeAnalysis } from "./volume.js";
import { fetchSentimentData } from "../data/sentiment.js";
import type {
  AnalysisReport,
  AssetType,
  MarketCondition,
  Timeframe,
  Quote,
  OHLCV,
} from "../types/index.js";

export interface ScanResult {
  reports: AnalysisReport[];
  marketCondition: MarketCondition;
  volumeAnalysis: Map<string, VolumeAnalysis>;
  errors: Array<{ ticker: string; error: string }>;
}

export async function scanWatchlist(
  stocks: string[],
  cryptos: string[],
  timeframe: Timeframe = "1d",
): Promise<ScanResult> {
  const errors: Array<{ ticker: string; error: string }> = [];
  const reports: AnalysisReport[] = [];
  const volumeAnalysis = new Map<string, VolumeAnalysis>();

  // Fetch market condition first
  const marketCondition = await getMarketCondition();

  // Scan stocks/ETFs
  const stockPromises = stocks.map(async (ticker) => {
    try {
      const [quote, ohlcv] = await Promise.all([
        fetchQuote(ticker),
        fetchOHLCV(ticker, timeframe),
      ]);
      return buildReport(ticker, quote, ohlcv, timeframe, marketCondition);
    } catch (err) {
      errors.push({ ticker, error: String(err) });
      return null;
    }
  });

  // Scan crypto
  const cryptoPromises = cryptos.map(async (coinId) => {
    try {
      const [quote, ohlcv] = await Promise.all([
        fetchCryptoPrice(coinId),
        fetchCryptoOHLC(coinId, 30),
      ]);
      return buildReport(coinId, quote, ohlcv, "1d", marketCondition);
    } catch (err) {
      errors.push({ ticker: coinId, error: String(err) });
      return null;
    }
  });

  const results = await Promise.allSettled([...stockPromises, ...cryptoPromises]);

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      reports.push(result.value.report);
      volumeAnalysis.set(result.value.report.ticker, result.value.volAnalysis);
    }
  }

  return { reports, marketCondition, volumeAnalysis, errors };
}

function buildReport(
  ticker: string,
  quote: Quote,
  ohlcv: OHLCV[],
  timeframe: Timeframe,
  marketCondition: MarketCondition,
): { report: AnalysisReport; volAnalysis: VolumeAnalysis } | null {
  if (ohlcv.length < 50) {
    // Not enough data for reliable analysis
    return null;
  }

  const technicals = computeTechnicalAnalysis(ticker, ohlcv, timeframe);
  const levels = computeLevelAnalysis(ticker, ohlcv);
  const volAnalysis = computeVolumeAnalysis(ohlcv);

  return {
    report: {
      ticker,
      assetType: quote.assetType,
      quote,
      technicals,
      levels,
      marketCondition,
      timestamp: new Date(),
    },
    volAnalysis,
  };
}

async function getMarketCondition(): Promise<MarketCondition> {
  let sentiment;
  try {
    sentiment = await fetchSentimentData();
  } catch (err) {
    console.warn("Warning: sentiment data unavailable, using neutral default:", err);
    sentiment = {
      fearGreed: { value: 50, classification: "Neutral", timestamp: new Date() },
    };
  }

  let sp500Change = 0;
  let nasdaqChange = 0;

  try {
    const [spy, qqq] = await Promise.all([fetchQuote("SPY"), fetchQuote("QQQ")]);
    sp500Change = spy.changePercent;
    nasdaqChange = qqq.changePercent;
  } catch (err) {
    console.warn("Warning: market index data unavailable:", err);
  }

  let regime: MarketCondition["regime"] = "range_bound";
  const avgChange = (Math.abs(sp500Change) + Math.abs(nasdaqChange)) / 2;

  if (avgChange > 2) {
    regime = "high_volatility";
  } else if (sp500Change > 0.5 && nasdaqChange > 0.5) {
    regime = "trending_up";
  } else if (sp500Change < -0.5 && nasdaqChange < -0.5) {
    regime = "trending_down";
  } else if (avgChange < 0.2) {
    regime = "low_volatility";
  }

  return {
    regime,
    sp500Change,
    nasdaqChange,
    sentiment,
    timestamp: new Date(),
  };
}

export function formatReportForAgent(report: AnalysisReport): string {
  const { quote, technicals, levels } = report;
  const lines = [
    `=== ${report.ticker} (${report.assetType.toUpperCase()}) ===`,
    `Price: $${quote.price.toFixed(2)} | Change: ${quote.changePercent.toFixed(2)}%`,
    `Volume: ${formatNumber(quote.volume)} (Avg: ${formatNumber(quote.avgVolume)})`,
    "",
    "--- Trend ---",
    `EMA 9: ${technicals.trend.ema9.value.toFixed(2)} (${technicals.trend.ema9.interpretation})`,
    `EMA 21: ${technicals.trend.ema21.value.toFixed(2)} (${technicals.trend.ema21.interpretation})`,
    `EMA 50: ${technicals.trend.ema50.value.toFixed(2)} (${technicals.trend.ema50.interpretation})`,
    `EMA 200: ${technicals.trend.ema200.value.toFixed(2)} (${technicals.trend.ema200.interpretation})`,
    `MACD: ${technicals.trend.macd.macdLine.toFixed(4)} / Signal: ${technicals.trend.macd.signalLine.toFixed(4)} (${technicals.trend.macd.interpretation})`,
    `ADX: ${technicals.trend.adx.value.toFixed(2)} (${technicals.trend.adx.interpretation})`,
    "",
    "--- Momentum ---",
    `RSI (14): ${technicals.momentum.rsi.value.toFixed(2)} (${technicals.momentum.rsi.interpretation})`,
    `Stochastic: K=${technicals.momentum.stochastic.k.toFixed(2)}, D=${technicals.momentum.stochastic.d.toFixed(2)} (${technicals.momentum.stochastic.interpretation})`,
    `CCI: ${technicals.momentum.cci.value.toFixed(2)} (${technicals.momentum.cci.interpretation})`,
    `Williams %R: ${technicals.momentum.williamsR.value.toFixed(2)} (${technicals.momentum.williamsR.interpretation})`,
    "",
    "--- Volatility ---",
    `BB: Upper=${technicals.volatility.bollingerBands.upper.toFixed(2)}, Mid=${technicals.volatility.bollingerBands.middle.toFixed(2)}, Lower=${technicals.volatility.bollingerBands.lower.toFixed(2)} (%B=${technicals.volatility.bollingerBands.percentB.toFixed(2)})`,
    `ATR: ${technicals.volatility.atr.value.toFixed(2)}`,
    `Keltner: Upper=${technicals.volatility.keltnerChannels.upper.toFixed(2)}, Lower=${technicals.volatility.keltnerChannels.lower.toFixed(2)}`,
    "",
    "--- Volume ---",
    `OBV: ${formatNumber(technicals.volume.obv.value)} (${technicals.volume.obv.interpretation})`,
    `VWAP: ${technicals.volume.vwap.value.toFixed(2)} (${technicals.volume.vwap.interpretation})`,
    `CMF: ${technicals.volume.cmf.value.toFixed(4)} (${technicals.volume.cmf.interpretation})`,
    "",
    "--- Key Levels ---",
    `Nearest Support: $${levels.nearestSupport.toFixed(2)}`,
    `Nearest Resistance: $${levels.nearestResistance.toFixed(2)}`,
    `Fibonacci: 38.2%=$${levels.fibonacci.level382.toFixed(2)}, 50%=$${levels.fibonacci.level500.toFixed(2)}, 61.8%=$${levels.fibonacci.level618.toFixed(2)}`,
    `Pivot: PP=$${levels.pivots.pivot.toFixed(2)}, R1=$${levels.pivots.r1.toFixed(2)}, S1=$${levels.pivots.s1.toFixed(2)}`,
    "",
    `Overall Bias: ${technicals.overallBias.toUpperCase()} (Confluence: ${technicals.confluenceScore}/10)`,
  ];

  return lines.join("\n");
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toFixed(0);
}
