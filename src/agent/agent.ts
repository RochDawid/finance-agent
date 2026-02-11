import {
  query,
  type SDKAssistantMessage,
  type SDKResultSuccess
} from "@anthropic-ai/claude-agent-sdk";
import { formatReportForAgent } from "../analysis/scanner.js";
import type { AnalysisReport } from "../types/index.js";
import { SignalSchema, type Signal } from "../types/index.js";
import { SYSTEM_PROMPT } from "./prompts/system.js";
import { createTradingMcpServer } from "./tools.js";

export interface AgentResponse {
  marketOverview: string;
  signals: Signal[];
  noSignalReason?: string;
  rawText: string;
  costUsd: number;
}

export async function runAgent(
  reports: AnalysisReport[],
): Promise<AgentResponse> {
  const mcpServer = createTradingMcpServer();

  // Build the prompt with analysis reports
  const reportsText = reports
    .map((r) => formatReportForAgent(r))
    .join("\n\n" + "=".repeat(60) + "\n\n");

  const prompt = `Analyze the following watchlist scan data and generate specific, actionable trade signals. Use the provided tools to deep-dive into any ticker that shows potential.

## Watchlist Scan Results

${reportsText}

## Instructions

1. Review each ticker's technical data above
2. Use the tools to get additional data for any promising setups (different timeframes, support/resistance levels, sentiment)
3. Apply your entry criteria — require 3+ confluent factors
4. Generate signals ONLY for setups that meet all your risk management rules
5. Return your analysis as a JSON object with the structure specified in your system prompt

Remember: it's better to return zero signals than to force a marginal trade.`;

  let resultText = "";
  let costUsd = 0;

  const conversation = query({
    prompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      model: "claude-sonnet-4-5-20250929",
      mcpServers: { "finance-tools": mcpServer },
      maxTurns: 10,
      tools: [],
    },
  });

  for await (const message of conversation) {
    if (message.type === "assistant") {
      const assistantMsg = message as SDKAssistantMessage;
      for (const block of assistantMsg.message.content) {
        if (block.type === "text") {
          resultText += block.text;
        }
      }
    }
    if (message.type === "result" && message.subtype === "success") {
      const result = message as SDKResultSuccess;
      resultText = result.result;
      costUsd = result.total_cost_usd;
    }
  }

  return parseAgentResponse(resultText, costUsd);
}

function parseAgentResponse(text: string, costUsd: number): AgentResponse {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*"signals"[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      marketOverview: text.slice(0, 500),
      signals: [],
      noSignalReason: "Could not parse structured response from agent",
      rawText: text,
      costUsd,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const signals: Signal[] = [];

    if (Array.isArray(parsed.signals)) {
      for (const s of parsed.signals) {
        try {
          const validated = SignalSchema.parse({
            ...s,
            timestamp: s.timestamp ?? new Date().toISOString(),
          });
          signals.push(validated);
        } catch (err) {
          console.warn(
            `Warning: skipping invalid signal for ${s.ticker ?? "unknown"}:`,
            err,
          );
        }
      }
    }

    return {
      marketOverview: parsed.marketOverview ?? "",
      signals,
      noSignalReason: parsed.noSignalReason,
      rawText: text,
      costUsd,
    };
  } catch (err) {
    console.warn("Warning: failed to parse agent response JSON:", err);
    return {
      marketOverview: text.slice(0, 500),
      signals: [],
      noSignalReason: "Failed to parse JSON from agent response",
      rawText: text,
      costUsd,
    };
  }
}

// Run a one-shot analysis for a specific ticker
export async function analyzeOneTicker(
  ticker: string,
  assetType: "stock" | "etf" | "crypto" = "stock",
): Promise<AgentResponse> {
  const mcpServer = createTradingMcpServer();

  const prompt = `Analyze ${ticker} (${assetType}) for potential day trading signals. Use the tools to:
1. Get current price data and recent OHLCV
2. Run full technical analysis on the daily and hourly timeframe
3. Check support/resistance levels
4. Check market sentiment

Then generate specific trade signals if a valid setup exists, or explain why no signal is appropriate.`;

  let resultText = "";
  let costUsd = 0;

  const conversation = query({
    prompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      model: "claude-sonnet-4-5-20250929",
      mcpServers: { "finance-tools": mcpServer },
      maxTurns: 8,
      tools: [],
    },
  });

  for await (const message of conversation) {
    if (message.type === "result" && message.subtype === "success") {
      const result = message as SDKResultSuccess;
      resultText = result.result;
      costUsd = result.total_cost_usd;
    }
  }

  return parseAgentResponse(resultText, costUsd);
}
