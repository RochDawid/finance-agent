import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ModelProvider } from "../types/index.js";

export function getApiKey(provider: ModelProvider): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "google":
      return process.env.GOOGLE_API_KEY;
  }
}

export function createModel(provider: ModelProvider, modelName: string, apiKey: string) {
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(modelName);
    case "openai":
      return createOpenAI({ apiKey })(modelName);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelName);
  }
}
