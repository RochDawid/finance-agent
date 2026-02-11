import type { OHLCV, Quote } from "../types/index.js";

const BASE_URL = "https://api.coingecko.com/api/v3";

interface CoinGeckoPrice {
  [id: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
}

async function fetchJSON<T>(url: string, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchCryptoPrice(
  coinId: string,
  apiKey?: string,
): Promise<Quote> {
  const data = await fetchJSON<CoinGeckoPrice>(
    `${BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
    apiKey,
  );

  const coin = data[coinId];
  if (!coin) throw new Error(`Coin not found: ${coinId}`);

  const price = coin.usd;
  const change = price * (coin.usd_24h_change / 100);

  return {
    ticker: coinId,
    assetType: "crypto",
    price,
    change,
    changePercent: coin.usd_24h_change,
    volume: coin.usd_24h_vol,
    avgVolume: coin.usd_24h_vol, // CoinGecko doesn't provide avg; use 24h as proxy
    high: price, // Approximate; detailed data requires OHLC endpoint
    low: price,
    open: price - change,
    previousClose: price - change,
    marketCap: coin.usd_market_cap,
    timestamp: new Date(),
  };
}

export async function fetchCryptoOHLC(
  coinId: string,
  days: 1 | 7 | 14 | 30 = 30,
  apiKey?: string,
): Promise<OHLCV[]> {
  const data = await fetchJSON<number[][]>(
    `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
    apiKey,
  );

  return data
    .map((candle) => {
      const timestamp = candle[0];
      const open = candle[1];
      const high = candle[2];
      const low = candle[3];
      const close = candle[4];

      if (
        timestamp === undefined ||
        open === undefined ||
        high === undefined ||
        low === undefined ||
        close === undefined
      ) {
        return null;
      }

      return {
        timestamp: new Date(timestamp),
        open,
        high,
        low,
        close,
        volume: 0, // OHLC endpoint doesn't include volume
      };
    })
    .filter((candle): candle is OHLCV => candle !== null);
}

export async function fetchMultipleCryptoPrices(
  coinIds: string[],
  apiKey?: string,
): Promise<Quote[]> {
  const ids = coinIds.join(",");
  const data = await fetchJSON<CoinGeckoPrice>(
    `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
    apiKey,
  );

  const results: Quote[] = [];

  for (const id of coinIds) {
    const coin = data[id];
    if (!coin) continue;

    const price = coin.usd;
    const change = price * (coin.usd_24h_change / 100);
    
    results.push({
      ticker: id,
      assetType: "crypto",
      price,
      change,
      changePercent: coin.usd_24h_change,
      volume: coin.usd_24h_vol,
      avgVolume: coin.usd_24h_vol,
      high: price,
      low: price,
      open: price - change,
      previousClose: price - change,
      marketCap: coin.usd_market_cap,
      timestamp: new Date(),
    });
  }

  return results;
}
