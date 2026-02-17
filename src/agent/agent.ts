import { generateText, stepCountIs } from "ai";
import { formatReportForAgent } from "../analysis/analyzer.js";
import { loadConfig } from "../config.js";
import type { AnalysisReport } from "../types/index.js";
import { createModel, getApiKey } from "./provider.js";
import { SignalSchema, type Signal } from "../types/index.js";
import { SYSTEM_PROMPT } from "./prompts/system.js";
import { tradingTools } from "./tools.js";

export interface AgentResponse {
  marketOverview: string;
  signals: Signal[];
  noSignalReason?: string;
  rawText: string;
  costUsd: number;
}

// Approximate cost per 1M tokens (input/output) — best-effort, prices may change
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-sonnet-4-5-20250929": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  "gpt-4o": { input: 5, output: 15 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "o3-mini": { input: 1.1, output: 4.4 },
  "gemini-2.0-flash": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
};

function estimateCost(
  modelName: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const prices = MODEL_PRICES[modelName];
  if (!prices) return 0;
  return (
    (promptTokens * prices.input + completionTokens * prices.output) / 1_000_000
  );
}

function buildAnalysisPrompt(reports: AnalysisReport[]): string {
  const reportsText = reports
    .map((r) => formatReportForAgent(r))
    .join("\n\n" + "=".repeat(60) + "\n\n");

  return `Analyze the following watchlist analysis data and generate specific, actionable trade signals. Use the provided tools to deep-dive into any ticker that shows potential.

## Watchlist Analysis Results

${reportsText}

## Instructions

1. Review each ticker's technical data above
2. Use the tools to get additional data for any promising setups (different timeframes, support/resistance levels, sentiment)
3. Apply your entry criteria — require 3+ confluent factors
4. Generate signals ONLY for setups that meet all your risk management rules
5. Return your analysis as a JSON object with the structure specified in your system prompt

Remember: it's better to return zero signals than to force a marginal trade.`;
}

async function runAgentCore(
  prompt: string,
  apiKey: string | undefined,
  maxSteps: number,
): Promise<AgentResponse> {
  const config = loadConfig();
  const { provider, name: modelName } = config.model;

  const effectiveKey = apiKey ?? getApiKey(provider);
  if (!effectiveKey) {
    throw new Error(
      `No API key provided for provider "${provider}". ` +
        `Add ${provider.toUpperCase()}_API_KEY to your .env or configure it in Settings.`,
    );
  }

  const model = createModel(provider, modelName, effectiveKey);

  // Enable extended thinking for Anthropic models that support it
  const providerOptions =
    provider === "anthropic"
      ? { anthropic: { thinking: { type: "enabled" as const, budgetTokens: 16000 } } }
      : undefined;

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt,
    tools: tradingTools,
    stopWhen: stepCountIs(maxSteps),
    ...(providerOptions && { providerOptions }),
  });

  const cost = estimateCost(
    modelName,
    result.totalUsage.inputTokens ?? 0,
    result.totalUsage.outputTokens ?? 0,
  );

  return parseAgentResponse(result.text, cost);
}

export async function runAgent(
  reports: AnalysisReport[],
  apiKey?: string,
): Promise<AgentResponse> {
  return runAgentCore(buildAnalysisPrompt(reports), apiKey, 10);
}

export async function analyzeOneTicker(
  ticker: string,
  assetType: "stock" | "etf" | "crypto" = "stock",
  apiKey?: string,
): Promise<AgentResponse> {
  const prompt = `Analyze ${ticker} (${assetType}) for potential day trading signals. Use the tools to:
1. Get current price data and recent OHLCV
2. Run full technical analysis on the daily and hourly timeframe
3. Check support/resistance levels
4. Check market sentiment

Then generate specific trade signals if a valid setup exists, or explain why no signal is appropriate.`;

  return runAgentCore(prompt, apiKey, 8);
}

/**
 * Extracts the outermost JSON object containing "signals" from arbitrary text
 * using a brace-depth scanner, avoiding the greedy-regex pitfall where inner
 * `{}` in field values cause incorrect matches.
 */
function extractJsonObject(text: string): string | null {
  const signalsIdx = text.indexOf('"signals"');
  if (signalsIdx === -1) return null;

  // Walk backwards from "signals" to find the opening '{' of the enclosing object
  let start = -1;
  for (let i = signalsIdx - 1; i >= 0; i--) {
    if (text[i] === "{") {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  // Walk forward from start, tracking brace depth to find the matching '}'
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function parseAgentResponse(text: string, costUsd: number): AgentResponse {
  const jsonStr = extractJsonObject(text);
  if (!jsonStr) {
    return {
      marketOverview: text.slice(0, 500),
      signals: [],
      noSignalReason: "Could not parse structured response from agent",
      rawText: text,
      costUsd,
    };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const signals: Signal[] = [];
    let dropped = 0;

    if (Array.isArray(parsed.signals)) {
      const total = parsed.signals.length;
      for (const s of parsed.signals) {
        const result = SignalSchema.safeParse({
          ...s,
          timestamp: s.timestamp ?? new Date().toISOString(),
        });
        if (result.success) {
          signals.push(result.data);
        } else {
          dropped++;
        }
      }
      if (dropped > 0) {
        console.warn(
          `[agent] Dropped ${dropped} of ${total} signals due to validation failures`,
        );
      }
    }

    return {
      marketOverview: parsed.marketOverview ?? "",
      signals,
      noSignalReason: parsed.noSignalReason,
      rawText: text,
      costUsd,
    };
  } catch {
    return {
      marketOverview: text.slice(0, 500),
      signals: [],
      noSignalReason: "Failed to parse JSON from agent response",
      rawText: text,
      costUsd,
    };
  }
}
