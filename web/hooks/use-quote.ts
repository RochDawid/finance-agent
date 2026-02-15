"use client";

import useSWR from "swr";
import type { Quote } from "@finance/types/index.js";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useQuote(ticker: string) {
  const { data, error, isLoading, mutate } = useSWR<Quote>(
    `/api/ticker/${ticker}/quote`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { quote: data, error, isLoading, refresh: () => mutate() };
}
