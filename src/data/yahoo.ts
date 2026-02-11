import YahooFinance from "yahoo-finance2";
import type { OHLCV, Quote, Timeframe } from "../types/index.js";

const yahooFinance = new YahooFinance();

const TIMEFRAME_TO_INTERVAL: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "60m",
  "4h": "60m", // Yahoo doesn't support 4h natively; we'll aggregate
  "1d": "1d",
};

const TIMEFRAME_TO_RANGE: Record<Timeframe, string> = {
  "1m": "1d",
  "5m": "5d",
  "15m": "5d",
  "1h": "1mo",
  "4h": "3mo",
  "1d": "6mo",
};

export async function fetchOHLCV(
  ticker: string,
  timeframe: Timeframe = "1d",
): Promise<OHLCV[]> {
  const result = await yahooFinance.chart(ticker, {
    interval: TIMEFRAME_TO_INTERVAL[timeframe] as "1d",
    period1: getStartDate(timeframe),
    return: "array",
  });

  const quotes = result.quotes;
  const ohlcv: OHLCV[] = quotes
    .filter((q: { open: number | null; high: number | null; low: number | null; close: number | null }) =>
      q.open != null && q.high != null && q.low != null && q.close != null)
    .map((q: { date: Date; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null }) => ({
      timestamp: new Date(q.date),
      open: q.open!,
      high: q.high!,
      low: q.low!,
      close: q.close!,
      volume: q.volume ?? 0,
    }));

  if (timeframe === "4h") {
    return aggregateTo4h(ohlcv);
  }

  return ohlcv;
}

export async function fetchQuote(ticker: string): Promise<Quote> {
  const result = await yahooFinance.quote(ticker);

  return {
    ticker,
    assetType: inferAssetType(ticker),
    price: result.regularMarketPrice ?? 0,
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    volume: result.regularMarketVolume ?? 0,
    avgVolume: result.averageDailyVolume3Month ?? 0,
    high: result.regularMarketDayHigh ?? 0,
    low: result.regularMarketDayLow ?? 0,
    open: result.regularMarketOpen ?? 0,
    previousClose: result.regularMarketPreviousClose ?? 0,
    marketCap: ("marketCap" in result ? result.marketCap : undefined) ?? undefined,
    timestamp: new Date(),
  };
}

export async function fetchMultipleQuotes(tickers: string[]): Promise<Quote[]> {
  const promises = tickers.map((t) => fetchQuote(t));
  const results = await Promise.allSettled(promises);
  return results
    .filter((r): r is PromiseFulfilledResult<Quote> => r.status === "fulfilled")
    .map((r) => r.value);
}

function inferAssetType(ticker: string): "stock" | "etf" | "crypto" {
  const etfs = ["SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", "ARKK", "XLF", "XLE", "XLK"];
  if (etfs.includes(ticker.toUpperCase())) return "etf";
  if (ticker.includes("-USD") || ticker.includes("-BTC")) return "crypto";
  return "stock";
}

function getStartDate(timeframe: Timeframe): Date {
  const now = new Date();
  const ranges: Record<Timeframe, number> = {
    "1m": 1,
    "5m": 5,
    "15m": 5,
    "1h": 30,
    "4h": 90,
    "1d": 180,
  };
  const daysBack = ranges[timeframe];
  return new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
}

function aggregateTo4h(hourlyBars: OHLCV[]): OHLCV[] {
  const result: OHLCV[] = [];
  for (let i = 0; i < hourlyBars.length; i += 4) {
    const chunk = hourlyBars.slice(i, i + 4);
    if (chunk.length === 0) continue;
    result.push({
      timestamp: chunk[0].timestamp,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c) => c.high)),
      low: Math.min(...chunk.map((c) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((sum, c) => sum + c.volume, 0),
    });
  }
  return result;
}
