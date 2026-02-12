"use client";

import useSWR from "swr";
import type { OHLCV, Timeframe } from "@finance/types/index.js";

interface OHLCVResponse {
  ticker: string;
  timeframe: string;
  data: OHLCV[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useOHLCV(
  ticker: string | null,
  timeframe: Timeframe = "1d",
  type: "stock" | "crypto" = "stock",
) {
  const { data, error, isLoading } = useSWR<OHLCVResponse>(
    ticker ? `/api/ticker/${ticker}/ohlcv?tf=${timeframe}&type=${type}` : null,
    fetcher,
    { refreshInterval: 60_000 },
  );

  return { data: data?.data, error, isLoading };
}
