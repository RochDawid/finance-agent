import { loadConfig } from "./config.js";
import { scanWatchlist } from "./analysis/scanner.js";
import { runAgent } from "./agent/agent.js";
import { startDashboard } from "./dashboard/index.js";
import chalk from "chalk";

const args = process.argv.slice(2);
const isScanMode = args.includes("--scan");

async function main() {
  const config = loadConfig();

  if (isScanMode) {
    await runScanMode(config);
  } else {
    startDashboard(config);
  }
}

async function runScanMode(config: ReturnType<typeof loadConfig>) {
  console.log(chalk.cyan.bold("\n  Finance Agent — One-Shot Scan\n"));
  console.log(chalk.dim(`Watchlist: ${[...config.watchlist.stocks, ...config.watchlist.crypto].join(", ")}`));
  console.log(chalk.dim(`Portfolio: $${config.risk.portfolioSize.toLocaleString()} | Max Risk: ${(config.risk.maxRiskPerTrade * 100).toFixed(0)}% | Min R:R: ${config.risk.minRiskReward}:1\n`));

  // Step 1: Scan watchlist
  console.log(chalk.yellow("Scanning watchlist..."));
  const scanResult = await scanWatchlist(
    config.watchlist.stocks,
    config.watchlist.crypto,
  );

  console.log(chalk.green(`Scanned ${scanResult.reports.length} tickers`));
  if (scanResult.errors.length > 0) {
    for (const err of scanResult.errors) {
      console.log(chalk.red(`  Error: ${err.ticker} — ${err.error}`));
    }
  }

  // Market condition summary
  const mc = scanResult.marketCondition;
  console.log(chalk.dim(`\nMarket: ${mc.regime} | S&P: ${mc.sp500Change >= 0 ? "+" : ""}${mc.sp500Change.toFixed(2)}% | NASDAQ: ${mc.nasdaqChange >= 0 ? "+" : ""}${mc.nasdaqChange.toFixed(2)}%`));
  console.log(chalk.dim(`Fear/Greed: ${mc.sentiment.fearGreed.value} (${mc.sentiment.fearGreed.classification})\n`));

  if (scanResult.reports.length === 0) {
    console.log(chalk.red("No data to analyze. Exiting."));
    process.exit(1);
  }

  // Step 2: Run agent analysis
  console.log(chalk.magenta("Running AI analysis with Claude..."));
  const response = await runAgent(scanResult.reports);

  // Output results
  console.log(chalk.cyan.bold(`\n${"=".repeat(60)}`));
  console.log(chalk.cyan.bold("  TRADING SIGNALS"));
  console.log(chalk.cyan.bold(`${"=".repeat(60)}\n`));

  if (response.marketOverview) {
    console.log(chalk.white(response.marketOverview));
    console.log();
  }

  if (response.signals.length === 0) {
    console.log(chalk.yellow("No signals generated."));
    if (response.noSignalReason) {
      console.log(chalk.dim(response.noSignalReason));
    }
  } else {
    for (const signal of response.signals) {
      const dirColor = signal.direction === "long" ? chalk.green : chalk.red;
      const dirArrow = signal.direction === "long" ? "▲" : "▼";

      console.log(dirColor.bold(`${dirArrow} ${signal.ticker} — ${signal.direction.toUpperCase()} (${signal.confidence}, ${signal.confidenceScore}%)`));
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
  }

  console.log(chalk.dim(`\nCost: $${response.costUsd.toFixed(4)}`));
}

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
