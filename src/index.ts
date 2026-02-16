import chalk from "chalk";
import { loadConfig } from "./config.js";
import { startDashboard } from "./dashboard/index.js";

const args = process.argv.slice(2);
const isAnalyzeMode = args.includes("--analyze");

async function main() {
  const config = loadConfig();

  if (isAnalyzeMode) {
    // One-shot analysis: run once and exit
    const { runOneAnalysis } = await import("./dashboard/index.js");
    console.log(chalk.cyan.bold("\n  Finance Agent — One-Shot Analysis\n"));
    await runOneAnalysis(config);
  } else {
    // Live mode: analyze and auto-refresh
    await startDashboard(config);
  }
}

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
