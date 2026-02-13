import { NextResponse } from "next/server";
import { loadConfig, findConfigPath } from "@finance/config.js";
import { writeFileSync } from "node:fs";
import { stringify } from "yaml";

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
    writeFileSync(findConfigPath(), stringify(body), "utf-8");
    return NextResponse.json({ status: "updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
