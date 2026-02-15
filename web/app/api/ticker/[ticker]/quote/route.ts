import { NextResponse, type NextRequest } from "next/server";
import { fetchQuote } from "@finance/data/yahoo.js";
import { fetchCryptoPrice } from "@finance/data/coingecko.js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const type = request.nextUrl.searchParams.get("type") ?? "stock";

  try {
    const quote = type === "crypto"
      ? await fetchCryptoPrice(ticker)
      : await fetchQuote(ticker);
    return NextResponse.json(quote);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
