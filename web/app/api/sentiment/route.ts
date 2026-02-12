import { NextResponse } from "next/server";
import { fetchSentimentData } from "@finance/data/sentiment.js";

export async function GET() {
  try {
    const sentiment = await fetchSentimentData();
    return NextResponse.json(sentiment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
