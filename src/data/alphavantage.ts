import type { OHLCV, Timeframe } from "../types/index.js";

const BASE_URL = "https://www.alphavantage.co/query";

const FUNCTION_MAP: Record<string, string> = {
  "1m": "TIME_SERIES_INTRADAY",
  "5m": "TIME_SERIES_INTRADAY",
  "15m": "TIME_SERIES_INTRADAY",
  "1h": "TIME_SERIES_INTRADAY",
  "1d": "TIME_SERIES_DAILY",
};

const INTERVAL_MAP: Record<string, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "1h": "60min",
};

interface AlphaVantageTimeSeries {
  [dateKey: string]: {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  };
}

export async function fetchOHLCV(
  ticker: string,
  timeframe: Timeframe,
  apiKey: string,
): Promise<OHLCV[]> {
  if (!apiKey) {
    throw new Error("Alpha Vantage API key required");
  }

  const func = FUNCTION_MAP[timeframe] ?? "TIME_SERIES_DAILY";
  const params = new URLSearchParams({
    function: func,
    symbol: ticker,
    apikey: apiKey,
    outputsize: "compact",
  });

  if (INTERVAL_MAP[timeframe]) {
    params.set("interval", INTERVAL_MAP[timeframe]);
  }

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Alpha Vantage error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Record<string, unknown>;

  // Find the time series key (varies by function)
  const seriesKey = Object.keys(data).find((k) => k.includes("Time Series"));
  if (!seriesKey) {
    const note = (data["Note"] || data["Information"]) as string | undefined;
    if (note) throw new Error(`Alpha Vantage rate limit: ${note}`);
    throw new Error("No time series data in Alpha Vantage response");
  }

  const series = data[seriesKey] as AlphaVantageTimeSeries;
  return Object.entries(series)
    .map(([dateStr, values]) => ({
      timestamp: new Date(dateStr),
      open: parseFloat(values["1. open"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      close: parseFloat(values["4. close"]),
      volume: parseFloat(values["5. volume"]),
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
