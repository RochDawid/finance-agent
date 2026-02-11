import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/evals/**/*.eval.ts"],
    testTimeout: 60_000,
    hookTimeout: 30_000,
  },
});
