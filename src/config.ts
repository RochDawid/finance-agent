import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import "dotenv/config";
import type { AppConfig } from "./types/index.js";

export function loadConfig(configPath?: string): AppConfig {
  const paths = [
    configPath,
    resolve(process.cwd(), "config.yaml"),
    resolve(process.cwd(), "config.default.yaml"),
  ].filter(Boolean) as string[];

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, "utf-8");
        const config = parseYaml(raw) as AppConfig;

        // Allow env vars to override API keys
        config.apiKeys = {
          ...config.apiKeys,
          alphaVantage:
            process.env.ALPHA_VANTAGE_API_KEY ||
            config.apiKeys?.alphaVantage ||
            undefined,
          coinGecko:
            process.env.COINGECKO_API_KEY ||
            config.apiKeys?.coinGecko ||
            undefined,
        };

        return config;
      } catch (err) {
        console.warn(`Warning: failed to parse config at ${p}:`, err);
      }
    }
  }

  throw new Error(
    "No config file found. Create a config.yaml or config.default.yaml in the project root.",
  );
}
