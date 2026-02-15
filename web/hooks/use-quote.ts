"use client";

import { useQuery } from "@tanstack/react-query";
import type { Quote } from "@finance/types/index.js";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useQuote(ticker: string, assetType: "stock" | "crypto") {
  const { data, error, isLoading, refetch } = useQuery<Quote>({
    queryKey: ["quote", ticker, assetType],
    queryFn: () => fetcher(`/api/ticker/${ticker}/quote?type=${assetType}`),
    refetchOnWindowFocus: false,
  });

  return { quote: data, error, isLoading, refresh: refetch };
}
