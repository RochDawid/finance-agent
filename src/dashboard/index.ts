import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, Newline } from "ink";
import Spinner from "ink-spinner";
// ink-table is a CJS package; cast to resolve ESM interop type mismatch
import TableModule from "ink-table";
type ScalarRecord = Record<string, string | number | boolean | null | undefined>;
const Table = TableModule as unknown as React.ComponentType<{ data: ScalarRecord[] }>;
import type { Signal, MarketCondition, AppConfig } from "../types/index.js";
import { scanWatchlist, type ScanResult } from "../analysis/scanner.js";
import { runAgent, type AgentResponse } from "../agent/agent.js";

interface DashboardProps {
  config: AppConfig;
}

type ScanStatus = "idle" | "scanning" | "analyzing" | "done" | "error";

function Dashboard({ config }: DashboardProps) {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [marketCondition, setMarketCondition] = useState<MarketCondition | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [marketOverview, setMarketOverview] = useState<string>("");
  const [noSignalReason, setNoSignalReason] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [costUsd, setCostUsd] = useState<number>(0);
  const [selectedSignal, setSelectedSignal] = useState<number>(0);

  const runScan = useCallback(async () => {
    setStatus("scanning");
    setErrors([]);

    try {
      const result: ScanResult = await scanWatchlist(
        config.watchlist.stocks,
        config.watchlist.crypto,
      );
      setMarketCondition(result.marketCondition);
      setErrors(result.errors.map((e) => `${e.ticker}: ${e.error}`));

      if (result.reports.length === 0) {
        setStatus("error");
        setErrors(["No reports generated — check network/API access"]);
        return;
      }

      setStatus("analyzing");
      const agentResponse: AgentResponse = await runAgent(result.reports);
      setSignals(agentResponse.signals);
      setMarketOverview(agentResponse.marketOverview);
      setNoSignalReason(agentResponse.noSignalReason ?? "");
      setCostUsd(agentResponse.costUsd);
      setLastScan(new Date());
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrors([String(err)]);
    }
  }, [config]);

  useEffect(() => {
    runScan();
    const interval = setInterval(runScan, config.intervals.scan);
    return () => clearInterval(interval);
  }, [runScan, config.intervals.scan]);

  return React.createElement(
    Box,
    { flexDirection: "column", padding: 1 },
    // Header
    React.createElement(
      Box,
      { borderStyle: "bold", borderColor: "cyan", paddingX: 2 },
      React.createElement(Text, { bold: true, color: "cyan" }, "  Finance Agent — AI Trading Signals  "),
    ),
    React.createElement(Newline, null),

    // Status Bar
    React.createElement(
      Box,
      { gap: 2 },
      React.createElement(
        Text,
        { dimColor: true },
        `Status: `,
      ),
      status === "scanning"
        ? React.createElement(
            Box,
            { gap: 1 },
            React.createElement(Spinner, { type: "dots" }),
            React.createElement(Text, { color: "yellow" }, "Scanning watchlist..."),
          )
        : status === "analyzing"
          ? React.createElement(
              Box,
              { gap: 1 },
              React.createElement(Spinner, { type: "dots" }),
              React.createElement(Text, { color: "magenta" }, "Claude analyzing setups..."),
            )
          : status === "error"
            ? React.createElement(Text, { color: "red" }, "Error")
            : status === "done"
              ? React.createElement(Text, { color: "green" }, "Ready")
              : React.createElement(Text, { dimColor: true }, "Idle"),
      lastScan &&
        React.createElement(
          Text,
          { dimColor: true },
          `Last scan: ${lastScan.toLocaleTimeString()} | Cost: $${costUsd.toFixed(4)}`,
        ),
    ),
    React.createElement(Newline, null),

    // Market Overview
    marketCondition &&
      React.createElement(
        Box,
        { flexDirection: "column" },
        React.createElement(Text, { bold: true, underline: true }, "Market Overview"),
        React.createElement(
          Box,
          { gap: 3, marginTop: 1 },
          React.createElement(
            Text,
            { color: marketCondition.sp500Change >= 0 ? "green" : "red" },
            `S&P 500: ${marketCondition.sp500Change >= 0 ? "+" : ""}${marketCondition.sp500Change.toFixed(2)}%`,
          ),
          React.createElement(
            Text,
            { color: marketCondition.nasdaqChange >= 0 ? "green" : "red" },
            `NASDAQ: ${marketCondition.nasdaqChange >= 0 ? "+" : ""}${marketCondition.nasdaqChange.toFixed(2)}%`,
          ),
          React.createElement(
            Text,
            {
              color:
                marketCondition.sentiment.fearGreed.value < 30
                  ? "red"
                  : marketCondition.sentiment.fearGreed.value > 70
                    ? "green"
                    : "yellow",
            },
            `Fear/Greed: ${marketCondition.sentiment.fearGreed.value} (${marketCondition.sentiment.fearGreed.classification})`,
          ),
          React.createElement(
            Text,
            { dimColor: true },
            `Regime: ${marketCondition.regime.replace(/_/g, " ")}`,
          ),
        ),
        marketOverview &&
          React.createElement(
            Text,
            { dimColor: true, wrap: "wrap" },
            marketOverview,
          ),
        React.createElement(Newline, null),
      ),

    // Signals Table
    React.createElement(Text, { bold: true, underline: true }, "Active Signals"),
    React.createElement(Newline, null),
    signals.length > 0
      ? React.createElement(Table, {
          data: signals.map((s) => ({
            Ticker: s.ticker,
            Dir: s.direction === "long" ? "LONG" : "SHORT",
            Entry: `$${s.entryPrice.toFixed(2)}`,
            Stop: `$${s.stopLoss.toFixed(2)}`,
            TP1: `$${s.takeProfit1.toFixed(2)}`,
            TP2: `$${s.takeProfit2.toFixed(2)}`,
            "R:R": s.riskRewardRatio.toFixed(1),
            Conf: `${s.confidenceScore}%`,
            TF: s.timeframe,
          })),
        })
      : React.createElement(
          Text,
          { dimColor: true },
          noSignalReason || "No signals generated yet",
        ),
    React.createElement(Newline, null),

    // Signal Details (first signal)
    signals.length > 0 &&
      React.createElement(
        Box,
        { flexDirection: "column", borderStyle: "single", borderColor: "gray", padding: 1 },
        React.createElement(
          Text,
          { bold: true },
          `Signal Detail: ${signals[selectedSignal]?.ticker ?? ""}`,
        ),
        React.createElement(Newline, null),
        React.createElement(
          Text,
          { wrap: "wrap" },
          signals[selectedSignal]?.reasoning ?? "",
        ),
        React.createElement(Newline, null),
        React.createElement(
          Text,
          { dimColor: true },
          `Confluence: ${signals[selectedSignal]?.confluenceFactors?.join(" | ") ?? "N/A"}`,
        ),
        React.createElement(
          Text,
          { dimColor: true },
          `Invalidation: $${signals[selectedSignal]?.invalidationLevel?.toFixed(2) ?? "N/A"} | Position: ${signals[selectedSignal]?.positionSizePct?.toFixed(1) ?? "N/A"}%`,
        ),
      ),

    // Errors
    errors.length > 0 &&
      React.createElement(
        Box,
        { flexDirection: "column", marginTop: 1 },
        React.createElement(Text, { color: "red", bold: true }, "Errors:"),
        ...errors.slice(0, 5).map((e, i) =>
          React.createElement(Text, { key: String(i), color: "red", dimColor: true }, `  ${e}`),
        ),
      ),
  );
}

export function startDashboard(config: AppConfig) {
  const app = render(React.createElement(Dashboard, { config }));
  return app;
}
