import { NextResponse } from "next/server";
import { getAnalysisCache, getAnalysisHistory, isAnalyzing } from "@/lib/analysis-cache";
import { performAnalysis } from "@/lib/analysis-loop";

export async function GET() {
  const cache = getAnalysisCache();
  return NextResponse.json({
    ...cache,
    isAnalyzing: isAnalyzing(),
    history: getAnalysisHistory(),
  });
}

export async function POST(req: Request) {
  if (isAnalyzing()) {
    return NextResponse.json({ error: "Analysis already in progress" }, { status: 409 });
  }

  let selectedTickers: string[] | undefined;
  try {
    const body = await req.json() as { selectedTickers?: string[] };
    if (Array.isArray(body.selectedTickers) && body.selectedTickers.length > 0) {
      selectedTickers = body.selectedTickers;
    }
  } catch {
    // no body or invalid JSON — analyze all
  }

  // Fire and forget — results come via WebSocket
  performAnalysis(undefined, selectedTickers);

  return NextResponse.json({ status: "started" });
}
