import { analyzeWatchlist } from "@finance/analysis/analyzer.js";
import { runAgent } from "@finance/agent/agent.js";
import { loadConfig } from "@finance/config.js";
import { broadcast } from "./ws-server.js";
import { setAnalysisCache, isAnalyzing, setAnalyzing } from "./analysis-cache.js";

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

export async function performAnalysis(apiKey?: string, selectedTickers?: string[]): Promise<void> {
  if (isAnalyzing()) {
    console.log("[analyze] Analysis already in progress, skipping");
    return;
  }

  const config = loadConfig();
  const { provider } = config.model;

  // Require an API key (user-provided or server env var)
  const envKey = PROVIDER_ENV_KEYS[provider];
  const effectiveKey = apiKey ?? (envKey ? process.env[envKey] : undefined);
  if (!effectiveKey) {
    broadcast("analysis:error", {
      error: `No API key configured for ${provider}. Add yours in Settings → API Keys.`,
    });
    return;
  }

  setAnalyzing(true);
  broadcast("analysis:start", {});

  try {
    const allStocks = config.watchlist.stocks;
    const allCrypto = config.watchlist.crypto;

    // Filter to selected tickers if provided, otherwise use all
    const stocks = selectedTickers
      ? allStocks.filter((s) => selectedTickers.includes(s))
      : allStocks;
    const crypto = selectedTickers
      ? allCrypto.filter((c) => selectedTickers.includes(c))
      : allCrypto;

    const modelLabel = PROVIDER_DISPLAY[provider] ?? provider;

    broadcast("analysis:progress", {
      stage: "Fetching market data",
      message: `Loading quotes for ${stocks.length + crypto.length} tickers...`,
    });
    const analysisResult = await analyzeWatchlist(stocks, crypto);

    broadcast("analysis:progress", {
      stage: "Running AI analysis",
      message: `${modelLabel} is analyzing the watchlist — this may take a minute...`,
    });
    // Never log the apiKey
    const agentResponse = await runAgent(analysisResult.reports, effectiveKey);

    setAnalysisCache(analysisResult, agentResponse);

    const volumeObj: Record<string, unknown> = {};
    for (const [key, value] of analysisResult.volumeAnalysis) {
      volumeObj[key] = value;
    }

    broadcast("analysis:complete", {
      signals: agentResponse.signals,
      marketOverview: agentResponse.marketOverview,
      marketCondition: analysisResult.marketCondition,
      reports: analysisResult.reports,
      volumeAnalysis: volumeObj,
      errors: analysisResult.errors,
      costUsd: agentResponse.costUsd,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[analyze] Error:", message);
    broadcast("analysis:error", { error: message });
  } finally {
    setAnalyzing(false);
  }
}
