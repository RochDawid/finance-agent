import type { ScanResult } from "@finance/analysis/scanner.js";
import type { AgentResponse } from "@finance/agent/agent.js";
import type { ScanCacheData } from "./types.js";

// Use globalThis so the cache is shared across all module instances
// (custom server + Next.js API route handlers may load this module separately)
declare global {
  // eslint-disable-next-line no-var
  var __scanCache: ScanCacheData | undefined;
  // eslint-disable-next-line no-var
  var __isScanning: boolean | undefined;
}

export function getScanCache(): ScanCacheData {
  return globalThis.__scanCache ?? { scanResult: null, agentResponse: null, timestamp: null };
}

export function setScanCache(scanResult: ScanResult, agentResponse: AgentResponse): void {
  globalThis.__scanCache = {
    scanResult,
    agentResponse,
    timestamp: new Date().toISOString(),
  };
}

export function isScanning(): boolean {
  return globalThis.__isScanning ?? false;
}

export function setScanning(value: boolean): void {
  globalThis.__isScanning = value;
}
