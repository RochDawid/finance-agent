import { scanWatchlist } from "@finance/analysis/scanner.js";
import { runAgent } from "@finance/agent/agent.js";
import { loadConfig } from "@finance/config.js";
import { broadcast } from "./ws-server.js";
import { setScanCache, isScanning, setScanning } from "./scan-cache.js";

const PROVIDER_ENV_KEYS: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
};

const PROVIDER_DISPLAY: Record<string, string> = {
  anthropic: "Claude",
  openai: "GPT",
  google: "Gemini",
};

export async function performScan(apiKey?: string): Promise<void> {
  if (isScanning()) {
    console.log("[scan] Scan already in progress, skipping");
    return;
  }

  const config = loadConfig();
  const { provider } = config.model;

  // Require an API key (user-provided or server env var)
  const envKey = PROVIDER_ENV_KEYS[provider];
  const effectiveKey = apiKey ?? (envKey ? process.env[envKey] : undefined);
  if (!effectiveKey) {
    broadcast("scan:error", {
      error: `No API key configured for ${provider}. Add yours in Settings → API Keys.`,
    });
    return;
  }

  setScanning(true);
  broadcast("scan:start", {});

  try {
    const { stocks, crypto } = config.watchlist;
    const modelLabel = PROVIDER_DISPLAY[provider] ?? provider;

    broadcast("scan:progress", {
      stage: "Fetching market data",
      message: `Loading quotes for ${stocks.length + crypto.length} tickers...`,
    });
    const scanResult = await scanWatchlist(stocks, crypto);

    broadcast("scan:progress", {
      stage: "Running AI analysis",
      message: `${modelLabel} is analyzing the watchlist — this may take a minute...`,
    });
    // Never log the apiKey
    const agentResponse = await runAgent(scanResult.reports, effectiveKey);

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
