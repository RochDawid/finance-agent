import type { Signal, MarketCondition, AnalysisReport } from "@finance/types/index.js";
import type { AgentResponse } from "@finance/agent/agent.js";
import type { ScanResult } from "@finance/analysis/scanner.js";
import type { VolumeAnalysis } from "@finance/analysis/volume.js";

export type WSEventType =
  | "scan:start"
  | "scan:progress"
  | "scan:complete"
  | "scan:error"
  | "connection:init";

export interface WSMessage {
  type: WSEventType;
  data: unknown;
  timestamp: string;
}

export interface SignalWithId extends Signal {
  id: string;
}

export interface DashboardState {
  signals: SignalWithId[];
  marketCondition: MarketCondition | null;
  reports: AnalysisReport[];
  volumeAnalysis: Record<string, VolumeAnalysis>;
  agentResponse: AgentResponse | null;
  isScanning: boolean;
  scanStage: string | null;
  scanMessage: string | null;
  lastScanTime: string | null;
  errors: Array<{ ticker: string; error: string }>;
}

export interface ScanCacheData {
  scanResult: ScanResult | null;
  agentResponse: AgentResponse | null;
  timestamp: string | null;
}
