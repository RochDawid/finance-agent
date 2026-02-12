import type { ScanResult } from "@finance/analysis/scanner.js";
import type { AgentResponse } from "@finance/agent/agent.js";
import type { ScanCacheData } from "./types.js";

let cache: ScanCacheData = {
  scanResult: null,
  agentResponse: null,
  timestamp: null,
};

let scanning = false;

export function getScanCache(): ScanCacheData {
  return cache;
}

export function setScanCache(scanResult: ScanResult, agentResponse: AgentResponse): void {
  cache = {
    scanResult,
    agentResponse,
    timestamp: new Date().toISOString(),
  };
}

export function isScanning(): boolean {
  return scanning;
}

export function setScanning(value: boolean): void {
  scanning = value;
}
