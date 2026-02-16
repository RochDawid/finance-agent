"use client";

import { useQuery } from "@tanstack/react-query";
import type { OHLCV, Timeframe } from "@finance/types/index.js";

interface OHLCVResponse {
  ticker: string;
  timeframe: string;
  data: OHLCV[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
};

export function useOHLCV(
  ticker: string | null,
  timeframe: Timeframe = "1d",
  type: "stock" | "crypto" = "stock",
) {
  const { data, error, isLoading } = useQuery<OHLCVResponse>({
    queryKey: ["ohlcv", ticker, timeframe, type],
    queryFn: () => fetcher(`/api/ticker/${ticker}/ohlcv?tf=${timeframe}&type=${type}`),
    enabled: !!ticker,
    refetchInterval: 60_000,
  });

  return { data: data?.data, error, isLoading };
}
