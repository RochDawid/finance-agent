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

function inferType(ticker: string): "stock" | "crypto" {
  return ticker === ticker.toLowerCase() ? "crypto" : "stock";
}

export function useTickerData(ticker: string | null) {
  const type = ticker ? inferType(ticker) : "stock";
  const { data, error, isLoading, mutate } = useSWR<TickerData>(
    ticker ? `/api/ticker/${ticker}?type=${type}` : null,
    fetcher,
    { refreshInterval: 30_000 },
  );

  return { data, error, isLoading, refresh: mutate };
}
