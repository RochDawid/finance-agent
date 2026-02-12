import { scanWatchlist } from "@finance/analysis/scanner.js";
import { runAgent } from "@finance/agent/agent.js";
import { loadConfig } from "@finance/config.js";
import { broadcast } from "./ws-server.js";
import { setScanCache, isScanning, setScanning } from "./scan-cache.js";

export async function performScan(): Promise<void> {
  if (isScanning()) {
    console.log("[scan] Scan already in progress, skipping");
    return;
  }

  setScanning(true);
  broadcast("scan:start", {});

  try {
    const config = loadConfig();
    const { stocks, crypto } = config.watchlist;

    broadcast("scan:progress", { stage: "fetching", message: "Fetching market data..." });
    const scanResult = await scanWatchlist(stocks, crypto);

    broadcast("scan:progress", { stage: "analyzing", message: "Running AI analysis..." });
    const agentResponse = await runAgent(scanResult.reports);

    setScanCache(scanResult, agentResponse);

    const volumeObj: Record<string, unknown> = {};
    for (const [key, value] of scanResult.volumeAnalysis) {
      volumeObj[key] = value;
    }

    broadcast("scan:complete", {
      signals: agentResponse.signals,
      marketOverview: agentResponse.marketOverview,
      marketCondition: scanResult.marketCondition,
      reports: scanResult.reports,
      volumeAnalysis: volumeObj,
      errors: scanResult.errors,
      costUsd: agentResponse.costUsd,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[scan] Error:", message);
    broadcast("scan:error", { error: message });
  } finally {
    setScanning(false);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startScanLoop(intervalMs?: number): void {
  const config = loadConfig();
  const interval = intervalMs ?? config.intervals.scan * 1000;

  console.log(`[scan] Starting scan loop with ${interval / 1000}s interval`);

  // Run initial scan
  performScan();

  intervalId = setInterval(() => {
    performScan();
  }, interval);
}

export function stopScanLoop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[scan] Scan loop stopped");
  }
}
