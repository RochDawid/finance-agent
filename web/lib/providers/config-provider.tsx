"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import useSWR from "swr";
import type { AppConfig } from "@finance/types/index.js";

interface ConfigContextValue {
  config: AppConfig | undefined;
  isLoading: boolean;
  error: Error | undefined;
  updateConfig: (config: AppConfig) => Promise<void>;
  addTicker: (ticker: string, type: "stocks" | "crypto") => Promise<void>;
  removeTicker: (ticker: string, type: "stocks" | "crypto") => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: undefined,
  isLoading: true,
  error: undefined,
  updateConfig: async () => {},
  addTicker: async () => {},
  removeTicker: async () => {},
});

export function useConfig() {
  return useContext(ConfigContext);
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, mutate } = useSWR<AppConfig>("/api/config", fetcher);

  const updateConfig = useCallback(
    async (config: AppConfig) => {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      await mutate();
    },
    [mutate],
  );

  const addTicker = useCallback(
    async (ticker: string, type: "stocks" | "crypto") => {
      await fetch("/api/config/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", ticker, type }),
      });
      await mutate();
    },
    [mutate],
  );

  const removeTicker = useCallback(
    async (ticker: string, type: "stocks" | "crypto") => {
      await fetch("/api/config/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", ticker, type }),
      });
      await mutate();
    },
    [mutate],
  );

  return (
    <ConfigContext value={{ config: data, isLoading, error, updateConfig, addTicker, removeTicker }}>
      {children}
    </ConfigContext>
  );
}
