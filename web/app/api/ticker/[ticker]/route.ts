import { NextResponse } from "next/server";
import { fetchQuote } from "@finance/data/yahoo.js";
import { fetchOHLCV } from "@finance/data/yahoo.js";
import { computeTechnicalAnalysis } from "@finance/analysis/indicators.js";
import { computeLevelAnalysis } from "@finance/analysis/levels.js";
import { computeVolumeAnalysis } from "@finance/analysis/volume.js";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;

  try {
    const [quote, ohlcv] = await Promise.all([
      fetchQuote(ticker),
      fetchOHLCV(ticker, "1d"),
    ]);

    const technicals = computeTechnicalAnalysis(ticker, ohlcv, "1d");
    const levels = computeLevelAnalysis(ticker, ohlcv);
    const volume = computeVolumeAnalysis(ohlcv);

    return NextResponse.json({
      quote,
      technicals,
      levels,
      volume,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
