import { NextResponse, type NextRequest } from "next/server";
import { fetchQuote, fetchOHLCV } from "@finance/data/yahoo.js";
import { fetchCryptoPrice, fetchCryptoOHLC } from "@finance/data/coingecko.js";
import { computeTechnicalAnalysis } from "@finance/analysis/indicators.js";
import { computeLevelAnalysis } from "@finance/analysis/levels.js";
import { computeVolumeAnalysis } from "@finance/analysis/volume.js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const type = request.nextUrl.searchParams.get("type") ?? "stock";

  try {
    const [quote, ohlcv] = type === "crypto"
      ? await Promise.all([fetchCryptoPrice(ticker), fetchCryptoOHLC(ticker, 30)])
      : await Promise.all([fetchQuote(ticker), fetchOHLCV(ticker, "1d")]);

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
