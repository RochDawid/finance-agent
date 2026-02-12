"use client";

import useSWR from "swr";
import type { Quote, TechnicalAnalysis, LevelAnalysis } from "@finance/types/index.js";
import type { VolumeAnalysis } from "@finance/analysis/volume.js";

interface TickerData {
  quote: Quote;
  technicals: TechnicalAnalysis;
  levels: LevelAnalysis;
  volume: VolumeAnalysis;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTickerData(ticker: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TickerData>(
    ticker ? `/api/ticker/${ticker}` : null,
    fetcher,
    { refreshInterval: 30_000 },
  );

  return { data, error, isLoading, refresh: mutate };
}
