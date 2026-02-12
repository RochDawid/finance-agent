import dotenv from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import type { AppConfig } from "./types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (parent of src/)
dotenv.config({ path: resolve(__dirname, "../.env") });

export function loadConfig(configPath?: string): AppConfig {
  const projectRoot = resolve(__dirname, "..");
  const paths = [
    configPath,
    resolve(process.cwd(), "config.yaml"),
    resolve(process.cwd(), "config.default.yaml"),
    resolve(projectRoot, "config.yaml"),
    resolve(projectRoot, "config.default.yaml"),
  ].filter(Boolean) as string[];

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, "utf-8");
        const rawParsed = parseYaml(raw);
        const parsed = (rawParsed && typeof rawParsed === "object" ? rawParsed : {}) as Partial<AppConfig>;

        const apiKeys: AppConfig["apiKeys"] = parsed.apiKeys ?? {};

        // Merge API keys handling strictly defined properties
        const mergedApiKeys: AppConfig["apiKeys"] = { ...apiKeys };
        if (process.env.ALPHA_VANTAGE_API_KEY) {
          mergedApiKeys.alphaVantage = process.env.ALPHA_VANTAGE_API_KEY;
        }
        if (process.env.COINGECKO_API_KEY) {
          mergedApiKeys.coinGecko = process.env.COINGECKO_API_KEY;
        }

        // 1. Define defaults
        const defaults = {
          watchlist: { stocks: [], crypto: [] },
          risk: { maxRiskPerTrade: 0.01, minRiskReward: 2, portfolioSize: 10000 },
          intervals: { scan: 3600, dataRefresh: 900 },
        };

        // 2. Merge defaults with parsed config
        const finalConfig: AppConfig = {
          ...parsed,
          watchlist: { ...defaults.watchlist, ...(parsed.watchlist ?? {}) },
          risk: { ...defaults.risk, ...(parsed.risk ?? {}) },
          intervals: { ...defaults.intervals, ...(parsed.intervals ?? {}) },
          apiKeys: mergedApiKeys,
        };

        return finalConfig;
      } catch (err) {
        console.warn(`Warning: failed to parse config at ${p}:`, err);
      }
    }
  }

  throw new Error(
    "No config file found. Create a config.yaml or config.default.yaml in the project root.",
  );
}
