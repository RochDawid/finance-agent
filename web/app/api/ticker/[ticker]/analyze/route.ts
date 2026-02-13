import { NextResponse } from "next/server";
import { analyzeOneTicker } from "@finance/agent/agent.js";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;

  try {
    const body = await request.json().catch(() => ({})) as { assetType?: string };
    const assetType = (body.assetType ?? "stock") as "stock" | "etf" | "crypto";
    const apiKey = request.headers.get("x-api-key") ?? undefined;
    const result = await analyzeOneTicker(ticker, assetType, apiKey);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
