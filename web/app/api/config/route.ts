import { NextResponse } from "next/server";
import { loadConfig } from "@finance/config.js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stringify } from "yaml";

function getConfigPath(): string {
  return resolve(import.meta.dirname, "../../../config.default.yaml");
}

export async function GET() {
  try {
    const config = loadConfig();
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const configPath = getConfigPath();
    writeFileSync(configPath, stringify(body), "utf-8");
    return NextResponse.json({ status: "updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
