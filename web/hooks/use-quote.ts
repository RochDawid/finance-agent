"use client";

import useSWR from "swr";
import type { Quote } from "@finance/types/index.js";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useQuote(ticker: string, assetType: "stock" | "crypto") {
  const { data, error, isLoading, mutate } = useSWR<Quote>(
    `/api/ticker/${ticker}/quote?type=${assetType}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { quote: data, error, isLoading, refresh: () => mutate() };
}
