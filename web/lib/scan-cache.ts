import type { ScanResult } from "@finance/analysis/scanner.js";
import type { AgentResponse } from "@finance/agent/agent.js";
import type { ScanCacheData, ScanHistoryEntry } from "./types.js";

// Use globalThis so the cache is shared across all module instances
// (custom server + Next.js API route handlers may load this module separately)
declare global {
  // eslint-disable-next-line no-var
  var __scanCache: ScanCacheData | undefined;
  // eslint-disable-next-line no-var
  var __isScanning: boolean | undefined;
  // eslint-disable-next-line no-var
  var __scanHistory: ScanHistoryEntry[] | undefined;
}

export function getScanCache(): ScanCacheData {
  return globalThis.__scanCache ?? { scanResult: null, agentResponse: null, timestamp: null };
}

export function getScanHistory(): ScanHistoryEntry[] {
  return globalThis.__scanHistory ?? [];
}

export function setScanCache(scanResult: ScanResult, agentResponse: AgentResponse): void {
  const timestamp = new Date().toISOString();
  globalThis.__scanCache = { scanResult, agentResponse, timestamp };

  const entry: ScanHistoryEntry = {
    timestamp,
    signals: agentResponse.signals,
    marketCondition: scanResult.marketCondition,
    marketOverview: agentResponse.marketOverview,
    costUsd: agentResponse.costUsd,
    errors: scanResult.errors,
    reports: scanResult.reports,
  };
  const prev = globalThis.__scanHistory ?? [];
  globalThis.__scanHistory = [entry, ...prev].slice(0, 3);
}

export function isScanning(): boolean {
  return globalThis.__isScanning ?? false;
}

export function setScanning(value: boolean): void {
  globalThis.__isScanning = value;
}
