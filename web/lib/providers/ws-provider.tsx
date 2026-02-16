"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { WSMessage, DashboardState, SignalWithId } from "../types";
import type { Signal } from "@finance/types/index.js";
import { useConfig } from "./config-provider";

interface WSContextValue {
  state: DashboardState;
  connected: boolean;
  hasApiKey: boolean;
  triggerAnalysis: () => void;
}

const initialState: DashboardState = {
  signals: [],
  marketCondition: null,
  reports: [],
  volumeAnalysis: {},
  agentResponse: null,
  isAnalyzing: false,
  analysisStage: null,
  analysisMessage: null,
  analysisError: null,
  lastAnalysisTime: null,
  errors: [],
};

const WSContext = createContext<WSContextValue>({
  state: initialState,
  connected: false,
  hasApiKey: false,
  triggerAnalysis: () => {},
});

export function useWS() {
  return useContext(WSContext);
}

function addIdsToSignals(signals: Signal[]): SignalWithId[] {
  return signals.map((s, i) => ({
    ...s,
    id: `${s.ticker}-${s.direction}-${i}`,
  }));
}

/** Returns the localStorage key name for the given provider */
function storageKeyFor(provider: string): string {
  return `${provider}_api_key`;
}

export function WSProvider({ children }: { children: ReactNode }) {
  const { config, serverHasApiKey } = useConfig();
  const provider = config?.model?.provider ?? "anthropic";

  const [state, setState] = useState<DashboardState>(initialState);
  const [connected, setConnected] = useState(false);
  const [localHasApiKey, setLocalHasApiKey] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("[ws] Connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WSMessage;

        switch (msg.type) {
          case "analysis:start":
            setState((prev) => ({ ...prev, isAnalyzing: true, analysisStage: null, analysisMessage: null, analysisError: null }));
            break;
          case "analysis:progress": {
            const progress = msg.data as { stage?: string; message?: string };
            setState((prev) => ({
              ...prev,
              analysisStage: progress.stage ?? prev.analysisStage,
              analysisMessage: progress.message ?? prev.analysisMessage,
            }));
            break;
          }
          case "analysis:complete": {
            const data = msg.data as {
              signals: Signal[];
              marketCondition: DashboardState["marketCondition"];
              reports: DashboardState["reports"];
              volumeAnalysis: DashboardState["volumeAnalysis"];
              errors: DashboardState["errors"];
              marketOverview: string;
              costUsd: number;
            };
            setState((prev) => ({
              ...prev,
              signals: addIdsToSignals(data.signals),
              marketCondition: data.marketCondition,
              reports: data.reports,
              volumeAnalysis: data.volumeAnalysis,
              agentResponse: {
                marketOverview: data.marketOverview,
                signals: data.signals,
                rawText: "",
                costUsd: data.costUsd,
              },
              isAnalyzing: false,
              analysisStage: null,
              analysisMessage: null,
              lastAnalysisTime: msg.timestamp,
              errors: data.errors,
            }));
            break;
          }
          case "analysis:error": {
            const errData = msg.data as { error?: string };
            setState((prev) => ({
              ...prev,
              isAnalyzing: false,
              analysisStage: null,
              analysisMessage: null,
              analysisError: errData.error ?? "An error occurred during the analysis.",
            }));
            break;
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("[ws] Disconnected, reconnecting in 3s...");
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    // Sync localHasApiKey from localStorage whenever provider or storage changes
    const syncKey = () => {
      setLocalHasApiKey(!!localStorage.getItem(storageKeyFor(provider)));
    };
    syncKey();
    window.addEventListener("storage", syncKey);
    return () => window.removeEventListener("storage", syncKey);
  }, [provider]);

  useEffect(() => {
    // Load initial cached data
    fetch("/api/analyze")
      .then((r) => r.json())
      .then((data: { analysisResult?: { reports?: DashboardState["reports"]; marketCondition?: DashboardState["marketCondition"]; errors?: DashboardState["errors"] }; agentResponse?: { signals?: Signal[]; marketOverview?: string; costUsd?: number; rawText?: string }; timestamp?: string; isAnalyzing?: boolean }) => {
        if (data.analysisResult && data.agentResponse) {
          setState((prev) => ({
            ...prev,
            signals: addIdsToSignals(data.agentResponse!.signals ?? []),
            marketCondition: data.analysisResult!.marketCondition ?? null,
            reports: data.analysisResult!.reports ?? [],
            agentResponse: data.agentResponse as DashboardState["agentResponse"],
            isAnalyzing: data.isAnalyzing ?? false,
            lastAnalysisTime: data.timestamp ?? null,
          }));
        }
      })
      .catch(() => {});

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const triggerAnalysis = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const apiKey = localStorage.getItem(storageKeyFor(provider)) ?? undefined;
      wsRef.current.send(JSON.stringify({ action: "trigger_analysis", apiKey }));
    }
  }, [provider]);

  const hasApiKey = localHasApiKey || serverHasApiKey;

  return (
    <WSContext value={{ state, connected, hasApiKey, triggerAnalysis }}>
      {children}
    </WSContext>
  );
}
