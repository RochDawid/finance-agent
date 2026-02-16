"use client";

import { useQuery } from "@tanstack/react-query";
import type { Quote, TechnicalAnalysis, LevelAnalysis } from "@finance/types/index.js";
import type { VolumeAnalysis } from "@finance/analysis/volume.js";

interface TickerData {
  quote: Quote;
  technicals: TechnicalAnalysis;
  levels: LevelAnalysis;
  volume: VolumeAnalysis;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
};

export function useTickerData(ticker: string | null, assetType: "stock" | "crypto" = "stock") {
  const { data, error, isLoading, refetch } = useQuery<TickerData>({
    queryKey: ["ticker", ticker, assetType],
    queryFn: () => fetcher(`/api/ticker/${ticker}?type=${assetType}`),
    enabled: !!ticker,
    refetchInterval: 30_000,
  });

  return { data, error, isLoading, refresh: refetch };
}
