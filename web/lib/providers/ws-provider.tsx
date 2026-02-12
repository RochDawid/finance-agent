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

interface WSContextValue {
  state: DashboardState;
  connected: boolean;
  triggerScan: () => void;
}

const initialState: DashboardState = {
  signals: [],
  marketCondition: null,
  reports: [],
  volumeAnalysis: {},
  agentResponse: null,
  isScanning: false,
  lastScanTime: null,
  errors: [],
};

const WSContext = createContext<WSContextValue>({
  state: initialState,
  connected: false,
  triggerScan: () => {},
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

export function WSProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [connected, setConnected] = useState(false);
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
          case "scan:start":
            setState((prev) => ({ ...prev, isScanning: true }));
            break;
          case "scan:progress":
            // Could display progress message
            break;
          case "scan:complete": {
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
              isScanning: false,
              lastScanTime: msg.timestamp,
              errors: data.errors,
            }));
            break;
          }
          case "scan:error":
            setState((prev) => ({ ...prev, isScanning: false }));
            break;
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
    // Load initial cached data
    fetch("/api/scan")
      .then((r) => r.json())
      .then((data: { scanResult?: { reports?: DashboardState["reports"]; marketCondition?: DashboardState["marketCondition"]; errors?: DashboardState["errors"] }; agentResponse?: { signals?: Signal[]; marketOverview?: string; costUsd?: number; rawText?: string }; timestamp?: string; isScanning?: boolean }) => {
        if (data.scanResult && data.agentResponse) {
          setState((prev) => ({
            ...prev,
            signals: addIdsToSignals(data.agentResponse!.signals ?? []),
            marketCondition: data.scanResult!.marketCondition ?? null,
            reports: data.scanResult!.reports ?? [],
            agentResponse: data.agentResponse as DashboardState["agentResponse"],
            isScanning: data.isScanning ?? false,
            lastScanTime: data.timestamp ?? null,
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

  const triggerScan = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "trigger_scan" }));
    }
  }, []);

  return (
    <WSContext value={{ state, connected, triggerScan }}>
      {children}
    </WSContext>
  );
}
