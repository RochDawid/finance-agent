import { NextResponse } from "next/server";
import { loadConfig, findConfigPath } from "@finance/config.js";
import { writeFileSync } from "node:fs";
import { stringify } from "yaml";

const PROVIDER_ENV_KEYS: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai:    "OPENAI_API_KEY",
  google:    "GOOGLE_API_KEY",
};

export async function GET() {
  try {
    const config = loadConfig();
    const envKey = PROVIDER_ENV_KEYS[config.model?.provider ?? "anthropic"];
    const serverHasApiKey = !!(envKey && process.env[envKey]);
    return NextResponse.json({ ...config, serverHasApiKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    writeFileSync(findConfigPath(), stringify(body), "utf-8");
    return NextResponse.json({ status: "updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
