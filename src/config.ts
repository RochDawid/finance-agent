import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import "dotenv/config";
import type { AppConfig } from "./types/index.js";

const DEFAULT_CONFIG: AppConfig = {
  watchlist: {
    stocks: ["AAPL", "MSFT", "NVDA", "TSLA", "META", "AMZN", "SPY", "QQQ"],
    crypto: ["bitcoin", "ethereum", "solana"],
  },
  risk: {
    maxRiskPerTrade: 0.02,
    minRiskReward: 2.0,
    portfolioSize: 10000,
    maxOpenPositions: 5,
    maxCorrelatedPositions: 2,
  },
  intervals: {
    scan: 300_000,
    dataRefresh: 60_000,
  },
  apiKeys: {},
};

export function loadConfig(configPath?: string): AppConfig {
  const paths = [
    configPath,
    resolve(process.cwd(), "config.yaml"),
    resolve(process.cwd(), "config.default.yaml"),
  ].filter(Boolean) as string[];

  let fileConfig: Partial<AppConfig> = {};

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, "utf-8");
        fileConfig = parseYaml(raw) as Partial<AppConfig>;
        break;
      } catch (err) {
        console.warn(`Warning: failed to parse config at ${p}:`, err);
      }
    }
  }

  // Merge with defaults
  const config: AppConfig = {
    watchlist: {
      stocks: fileConfig.watchlist?.stocks ?? DEFAULT_CONFIG.watchlist.stocks,
      crypto: fileConfig.watchlist?.crypto ?? DEFAULT_CONFIG.watchlist.crypto,
    },
    risk: {
      maxRiskPerTrade:
        fileConfig.risk?.maxRiskPerTrade ?? DEFAULT_CONFIG.risk.maxRiskPerTrade,
      minRiskReward:
        fileConfig.risk?.minRiskReward ?? DEFAULT_CONFIG.risk.minRiskReward,
      portfolioSize:
        fileConfig.risk?.portfolioSize ?? DEFAULT_CONFIG.risk.portfolioSize,
      maxOpenPositions:
        fileConfig.risk?.maxOpenPositions ?? DEFAULT_CONFIG.risk.maxOpenPositions,
      maxCorrelatedPositions:
        fileConfig.risk?.maxCorrelatedPositions ??
        DEFAULT_CONFIG.risk.maxCorrelatedPositions,
    },
    intervals: {
      scan: fileConfig.intervals?.scan ?? DEFAULT_CONFIG.intervals.scan,
      dataRefresh:
        fileConfig.intervals?.dataRefresh ?? DEFAULT_CONFIG.intervals.dataRefresh,
    },
    apiKeys: {
      alphaVantage:
        process.env.ALPHA_VANTAGE_API_KEY ||
        fileConfig.apiKeys?.alphaVantage ||
        undefined,
      coinGecko:
        process.env.COINGECKO_API_KEY ||
        fileConfig.apiKeys?.coinGecko ||
        undefined,
    },
  };

  return config;
}
