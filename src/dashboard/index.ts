import chalk from "chalk";
import type { Signal, AppConfig } from "../types/index.js";
import { scanWatchlist, type ScanResult } from "../analysis/scanner.js";
import { runAgent, type AgentResponse } from "../agent/agent.js";

function printHeader() {
  console.log(chalk.cyan.bold(`\n${"=".repeat(60)}`));
  console.log(chalk.cyan.bold("  Finance Agent — AI Trading Signals"));
  console.log(chalk.cyan.bold(`${"=".repeat(60)}\n`));
}

function printMarketCondition(result: ScanResult) {
  const mc = result.marketCondition;
  const sp500Color = mc.sp500Change >= 0 ? chalk.green : chalk.red;
  const nasdaqColor = mc.nasdaqChange >= 0 ? chalk.green : chalk.red;
  const fgValue = mc.sentiment.fearGreed.value;
  const fgColor = fgValue < 30 ? chalk.red : fgValue > 70 ? chalk.green : chalk.yellow;

  console.log(chalk.bold.underline("Market Overview"));
  console.log(
    `  ${sp500Color(`S&P 500: ${mc.sp500Change >= 0 ? "+" : ""}${mc.sp500Change.toFixed(2)}%`)}` +
    `  ${nasdaqColor(`NASDAQ: ${mc.nasdaqChange >= 0 ? "+" : ""}${mc.nasdaqChange.toFixed(2)}%`)}` +
    `  ${fgColor(`Fear/Greed: ${fgValue} (${mc.sentiment.fearGreed.classification})`)}` +
    `  ${chalk.dim(`Regime: ${mc.regime.replace(/_/g, " ")}`)}`,
  );
  console.log();
}

function printSignals(response: AgentResponse) {
  if (response.marketOverview) {
    console.log(chalk.white(response.marketOverview));
    console.log();
  }

  console.log(chalk.bold.underline("Active Signals"));
  console.log();

  if (response.signals.length === 0) {
    console.log(chalk.yellow("  No signals generated."));
    if (response.noSignalReason) {
      console.log(chalk.dim(`  ${response.noSignalReason}`));
    }
    console.log();
    return;
  }

  // Print signal table header
  console.log(
    chalk.dim(
      "  " +
      "Ticker".padEnd(8) +
      "Dir".padEnd(7) +
      "Entry".padEnd(12) +
      "Stop".padEnd(12) +
      "TP1".padEnd(12) +
      "TP2".padEnd(12) +
      "R:R".padEnd(6) +
      "Conf".padEnd(6) +
      "TF",
    ),
  );
  console.log(chalk.dim(`  ${"─".repeat(80)}`));

  for (const s of response.signals) {
    const dirColor = s.direction === "long" ? chalk.green : chalk.red;
    const arrow = s.direction === "long" ? "▲" : "▼";
    console.log(
      "  " +
      dirColor(`${arrow} ${s.ticker}`.padEnd(8)) +
      dirColor(s.direction.toUpperCase().padEnd(7)) +
      `$${s.entryPrice.toFixed(2)}`.padEnd(12) +
      chalk.red(`$${s.stopLoss.toFixed(2)}`.padEnd(12)) +
      chalk.green(`$${s.takeProfit1.toFixed(2)}`.padEnd(12)) +
      chalk.green(`$${s.takeProfit2.toFixed(2)}`.padEnd(12)) +
      `${s.riskRewardRatio.toFixed(1)}`.padEnd(6) +
      `${s.confidenceScore}%`.padEnd(6) +
      s.timeframe,
    );
  }
  console.log();

  // Print detailed reasoning for each signal
  for (const signal of response.signals) {
    printSignalDetail(signal);
  }
}

function printSignalDetail(signal: Signal) {
  const dirColor = signal.direction === "long" ? chalk.green : chalk.red;
  const arrow = signal.direction === "long" ? "▲" : "▼";

  console.log(chalk.dim("─".repeat(60)));
  console.log(dirColor.bold(`${arrow} ${signal.ticker} — ${signal.direction.toUpperCase()} (${signal.confidence}, ${signal.confidenceScore}%)`));
  console.log(`  Entry:   $${signal.entryPrice.toFixed(2)} (zone: $${signal.entryZoneLow.toFixed(2)} - $${signal.entryZoneHigh.toFixed(2)})`);
  console.log(chalk.red(`  Stop:    $${signal.stopLoss.toFixed(2)}`));
  console.log(chalk.green(`  TP1:     $${signal.takeProfit1.toFixed(2)}`));
  console.log(chalk.green(`  TP2:     $${signal.takeProfit2.toFixed(2)}`));
  console.log(chalk.green(`  TP3:     $${signal.takeProfit3.toFixed(2)}`));
  console.log(chalk.dim(`  R:R:     ${signal.riskRewardRatio.toFixed(1)}:1 | TF: ${signal.timeframe} | Size: ${signal.positionSizePct.toFixed(1)}%`));
  console.log(chalk.dim(`  Invalidation: $${signal.invalidationLevel.toFixed(2)}`));
  console.log();
  console.log(chalk.white(`  Reasoning: ${signal.reasoning}`));
  console.log(chalk.dim(`  Confluence: ${signal.confluenceFactors.join(" | ")}`));
  console.log();
}

function printErrors(errors: Array<{ ticker: string; error: string }>) {
  if (errors.length === 0) return;
  console.log(chalk.red.bold("Errors:"));
  for (const err of errors) {
    console.log(chalk.red.dim(`  ${err.ticker}: ${err.error}`));
  }
  console.log();
}

export async function runOneScan(config: AppConfig): Promise<void> {
  const tickers = [...config.watchlist.stocks, ...config.watchlist.crypto];
  console.log(chalk.dim(`Watchlist: ${tickers.join(", ")}`));
  console.log(chalk.dim(`Portfolio: $${config.risk.portfolioSize.toLocaleString()} | Max Risk: ${(config.risk.maxRiskPerTrade * 100).toFixed(0)}% | Min R:R: ${config.risk.minRiskReward}:1\n`));

  // Step 1: Scan watchlist
  console.log(chalk.yellow("Scanning watchlist..."));
  const scanResult = await scanWatchlist(config.watchlist.stocks, config.watchlist.crypto);

  console.log(chalk.green(`Scanned ${scanResult.reports.length} tickers`));
  printErrors(scanResult.errors);

  printMarketCondition(scanResult);

  if (scanResult.reports.length === 0) {
    console.log(chalk.red("No data to analyze."));
    return;
  }

  // Step 2: Run agent analysis
  console.log(chalk.magenta("Running AI analysis with Claude..."));
  const response = await runAgent(scanResult.reports);

  printSignals(response);

  console.log(chalk.dim(`Cost: $${response.costUsd.toFixed(4)}`));
}

export async function startDashboard(config: AppConfig): Promise<void> {
  printHeader();

  await runOneScan(config);

  // Auto-refresh loop
  const intervalMs = config.intervals.scan;
  console.log(chalk.dim(`\nNext scan in ${Math.round(intervalMs / 1000)}s (Ctrl+C to exit)\n`));

  const loop = setInterval(async () => {
    console.log(chalk.dim(`\n${"─".repeat(60)}`));
    console.log(chalk.dim(`Refreshing at ${new Date().toLocaleTimeString()}...\n`));
    try {
      await runOneScan(config);
      console.log(chalk.dim(`\nNext scan in ${Math.round(intervalMs / 1000)}s (Ctrl+C to exit)\n`));
    } catch (err) {
      console.error(chalk.red("Scan error:"), err);
    }
  }, intervalMs);

  // Keep process alive, clean up on exit
  process.on("SIGINT", () => {
    clearInterval(loop);
    console.log(chalk.dim("\nShutting down..."));
    process.exit(0);
  });

  // Return a promise that never resolves to keep the process alive
  return new Promise(() => {});
}
