import type { AnalysisResult } from "@finance/analysis/analyzer.js";
import type { AgentResponse } from "@finance/agent/agent.js";
import type { AnalysisCacheData, AnalysisHistoryEntry } from "./types.js";

// Use globalThis so the cache is shared across all module instances
// (custom server + Next.js API route handlers may load this module separately)
declare global {
  // eslint-disable-next-line no-var
  var __analysisCache: AnalysisCacheData | undefined;
  // eslint-disable-next-line no-var
  var __isAnalyzing: boolean | undefined;
  // eslint-disable-next-line no-var
  var __analysisHistory: AnalysisHistoryEntry[] | undefined;
}

export function getAnalysisCache(): AnalysisCacheData {
  return globalThis.__analysisCache ?? { analysisResult: null, agentResponse: null, timestamp: null };
}

export function getAnalysisHistory(): AnalysisHistoryEntry[] {
  return globalThis.__analysisHistory ?? [];
}

export function setAnalysisCache(analysisResult: AnalysisResult, agentResponse: AgentResponse): void {
  const timestamp = new Date().toISOString();
  globalThis.__analysisCache = { analysisResult, agentResponse, timestamp };

  const entry: AnalysisHistoryEntry = {
    timestamp,
    signals: agentResponse.signals,
    marketCondition: analysisResult.marketCondition,
    marketOverview: agentResponse.marketOverview,
    costUsd: agentResponse.costUsd,
    errors: analysisResult.errors,
    reports: analysisResult.reports,
  };
  const prev = globalThis.__analysisHistory ?? [];
  globalThis.__analysisHistory = [entry, ...prev].slice(0, 3);
}

export function isAnalyzing(): boolean {
  return globalThis.__isAnalyzing ?? false;
}

export function setAnalyzing(value: boolean): void {
  globalThis.__isAnalyzing = value;
}
