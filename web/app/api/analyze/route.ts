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

export async function POST() {
  if (isAnalyzing()) {
    return NextResponse.json({ error: "Analysis already in progress" }, { status: 409 });
  }

  // Fire and forget — results come via WebSocket
  performAnalysis();

  return NextResponse.json({ status: "started" });
}
