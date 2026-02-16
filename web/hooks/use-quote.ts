"use client";

import { useQuery } from "@tanstack/react-query";
import type { Quote } from "@finance/types/index.js";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
};

export function useQuote(ticker: string, assetType: "stock" | "crypto") {
  const { data, error, isLoading, refetch } = useQuery<Quote>({
    queryKey: ["quote", ticker, assetType],
    queryFn: () => fetcher(`/api/ticker/${ticker}/quote?type=${assetType}`),
    refetchOnWindowFocus: false,
  });

  return { quote: data, error, isLoading, refresh: refetch };
}
