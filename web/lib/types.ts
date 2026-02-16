import type { Signal, MarketCondition, AnalysisReport } from "@finance/types/index.js";
import type { AgentResponse } from "@finance/agent/agent.js";
import type { AnalysisResult } from "@finance/analysis/analyzer.js";
import type { VolumeAnalysis } from "@finance/analysis/volume.js";

export type WSEventType =
  | "analysis:start"
  | "analysis:progress"
  | "analysis:complete"
  | "analysis:error"
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
  isAnalyzing: boolean;
  analysisStage: string | null;
  analysisMessage: string | null;
  analysisError: string | null;
  lastAnalysisTime: string | null;
  errors: Array<{ ticker: string; error: string }>;
}

export interface AnalysisCacheData {
  analysisResult: AnalysisResult | null;
  agentResponse: AgentResponse | null;
  timestamp: string | null;
}

export interface AnalysisHistoryEntry {
  timestamp: string;
  signals: Signal[];
  marketCondition: MarketCondition | null;
  marketOverview: string;
  costUsd: number;
  errors: Array<{ ticker: string; error: string }>;
  reports: AnalysisReport[];
}
