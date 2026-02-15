"use client";

import useSWR from "swr";
import type { Quote } from "@finance/types/index.js";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function inferType(ticker: string): "stock" | "crypto" {
  return ticker === ticker.toLowerCase() ? "crypto" : "stock";
}

export function useQuote(ticker: string) {
  const type = inferType(ticker);
  const { data, error, isLoading, mutate } = useSWR<Quote>(
    `/api/ticker/${ticker}/quote?type=${type}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { quote: data, error, isLoading, refresh: () => mutate() };
}
