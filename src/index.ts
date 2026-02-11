import chalk from "chalk";
import { loadConfig } from "./config.js";
import { startDashboard } from "./dashboard/index.js";

const args = process.argv.slice(2);
const isScanMode = args.includes("--scan");

async function main() {
  const config = loadConfig();

  if (isScanMode) {
    // One-shot scan: run once and exit
    const { runOneScan } = await import("./dashboard/index.js");
    console.log(chalk.cyan.bold("\n  Finance Agent — One-Shot Scan\n"));
    await runOneScan(config);
  } else {
    // Live mode: scan and auto-refresh
    await startDashboard(config);
  }
}

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
