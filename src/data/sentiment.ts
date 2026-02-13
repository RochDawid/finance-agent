import type { Bias, FearGreedIndex, SentimentData } from "../types/index.js";

const FEAR_GREED_URL = "https://api.alternative.me/fng/";

interface FearGreedResponse {
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
  }>;
}

export async function fetchFearGreedIndex(): Promise<FearGreedIndex> {
  const res = await fetch(FEAR_GREED_URL);
  if (!res.ok) {
    throw new Error(`Fear & Greed API error: ${res.status}`);
  }

  const data = (await res.json()) as FearGreedResponse;
  const latest = data.data[0];
  if (!latest) throw new Error("Fear & Greed API returned no data");

  return {
    value: parseInt(latest.value, 10),
    classification: latest.value_classification,
    timestamp: new Date(parseInt(latest.timestamp, 10) * 1000),
  };
}

export function interpretFearGreed(value: number): Bias {
  if (value <= 25) return "bearish"; // Extreme fear → contrarian bullish? But for sentiment, it's bearish
  if (value <= 45) return "bearish";
  if (value <= 55) return "neutral";
  if (value <= 75) return "bullish";
  return "bullish"; // Extreme greed
}

export async function fetchSentimentData(): Promise<SentimentData> {
  const fearGreed = await fetchFearGreedIndex();

  return {
    fearGreed,
    // Market breadth would require additional data source
    // Placeholder for future integration
  };
}

export function getSentimentSummary(sentiment: SentimentData): string {
  const fg = sentiment.fearGreed;
  let summary = `Fear & Greed Index: ${fg.value}/100 (${fg.classification})`;

  if (sentiment.marketBreadth) {
    const mb = sentiment.marketBreadth;
    summary += ` | Market Breadth: ${mb.advancers}A/${mb.decliners}D (${mb.interpretation})`;
  }

  return summary;
}
