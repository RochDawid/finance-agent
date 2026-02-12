import { NextResponse, type NextRequest } from "next/server";
import { fetchOHLCV } from "@finance/data/yahoo.js";
import { fetchCryptoOHLC } from "@finance/data/coingecko.js";
import type { Timeframe } from "@finance/types/index.js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const searchParams = request.nextUrl.searchParams;
  const tf = (searchParams.get("tf") ?? "1d") as Timeframe;
  const type = searchParams.get("type") ?? "stock";

  try {
    let data;
    if (type === "crypto") {
      data = await fetchCryptoOHLC(ticker);
    } else {
      data = await fetchOHLCV(ticker, tf);
    }

    return NextResponse.json({ ticker, timeframe: tf, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
