"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppConfig } from "@finance/types/index.js";

interface ConfigContextValue {
  config: AppConfig | undefined;
  serverHasApiKey: boolean;
  isLoading: boolean;
  error: Error | undefined;
  updateConfig: (config: AppConfig) => Promise<void>;
  addTicker: (ticker: string, type: "stocks" | "crypto") => Promise<void>;
  removeTicker: (ticker: string, type: "stocks" | "crypto") => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: undefined,
  serverHasApiKey: false,
  isLoading: true,
  error: undefined,
  updateConfig: async () => {},
  addTicker: async () => {},
  removeTicker: async () => {},
});

export function useConfig() {
  return useContext(ConfigContext);
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
};

export function ConfigProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<AppConfig & { serverHasApiKey?: boolean }>({
    queryKey: ["config"],
    queryFn: () => fetcher("/api/config"),
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["config"] }),
    [queryClient],
  );

  const updateConfig = useCallback(
    async (config: AppConfig) => {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to save config");
      }
      await invalidate();
    },
    [invalidate],
  );

  const addTicker = useCallback(
    async (ticker: string, type: "stocks" | "crypto") => {
      const res = await fetch("/api/config/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", ticker, type }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to add ticker");
      }
      await invalidate();
    },
    [invalidate],
  );

  const removeTicker = useCallback(
    async (ticker: string, type: "stocks" | "crypto") => {
      const res = await fetch("/api/config/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", ticker, type }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to remove ticker");
      }
      await invalidate();
    },
    [invalidate],
  );

  return (
    <ConfigContext value={{ config: data, serverHasApiKey: data?.serverHasApiKey ?? false, isLoading, error: error ?? undefined, updateConfig, addTicker, removeTicker }}>
      {children}
    </ConfigContext>
  );
}
