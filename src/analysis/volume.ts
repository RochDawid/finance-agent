import { SMA } from "technicalindicators";
import type { OHLCV, Bias } from "../types/index.js";

export interface VolumeProfile {
  priceLevel: number;
  volume: number;
  pctOfTotal: number;
}

export interface VolumeAnalysis {
  profile: VolumeProfile[];
  pointOfControl: number; // price level with highest volume
  valueAreaHigh: number;
  valueAreaLow: number;
  currentVsAvg: number; // ratio of current volume to 20-period average
  volumeTrend: Bias;
}

export function computeVolumeProfile(
  data: OHLCV[],
  bins: number = 20,
): VolumeProfile[] {
  const allPrices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const binSize = (maxPrice - minPrice) / bins;

  const volumeByBin = new Array(bins).fill(0);

  for (const bar of data) {
    // Distribute volume across price range of the bar
    const lowBin = Math.floor((bar.low - minPrice) / binSize);
    const highBin = Math.min(Math.floor((bar.high - minPrice) / binSize), bins - 1);

    const barsSpanned = Math.max(highBin - lowBin + 1, 1);
    const volPerBin = bar.volume / barsSpanned;

    for (let b = Math.max(lowBin, 0); b <= Math.min(highBin, bins - 1); b++) {
      volumeByBin[b] += volPerBin;
    }
  }

  const totalVolume = volumeByBin.reduce((s, v) => s + v, 0);

  return volumeByBin.map((vol, i) => ({
    priceLevel: minPrice + (i + 0.5) * binSize,
    volume: vol,
    pctOfTotal: totalVolume > 0 ? vol / totalVolume : 0,
  }));
}

export function computeVolumeAnalysis(data: OHLCV[]): VolumeAnalysis {
  const profile = computeVolumeProfile(data);
  const volumes = data.map((d) => d.volume);

  // Point of Control: price level with most volume
  const poc = profile.reduce((max, p) => (p.volume > max.volume ? p : max), profile[0]);

  // Value Area: 70% of volume centered on POC
  const totalVol = profile.reduce((s, p) => s + p.volume, 0);
  const targetVol = totalVol * 0.7;
  const pocIdx = profile.indexOf(poc);

  let vaVol = poc.volume;
  let low = pocIdx;
  let high = pocIdx;

  while (vaVol < targetVol && (low > 0 || high < profile.length - 1)) {
    const lowerVol = low > 0 ? profile[low - 1].volume : 0;
    const upperVol = high < profile.length - 1 ? profile[high + 1].volume : 0;

    if (lowerVol >= upperVol && low > 0) {
      low--;
      vaVol += profile[low].volume;
    } else if (high < profile.length - 1) {
      high++;
      vaVol += profile[high].volume;
    } else {
      break;
    }
  }

  // Volume trend
  const volMA = SMA.calculate({ period: 20, values: volumes });
  const currentVol = volumes[volumes.length - 1];
  const avgVol = volMA[volMA.length - 1] ?? currentVol;
  const ratio = avgVol > 0 ? currentVol / avgVol : 1;

  // Check if volume is increasing or decreasing over recent bars
  const recentVols = volumes.slice(-5);
  const prevVols = volumes.slice(-10, -5);
  const recentAvg = recentVols.reduce((s, v) => s + v, 0) / recentVols.length;
  const prevAvg = prevVols.length > 0 ? prevVols.reduce((s, v) => s + v, 0) / prevVols.length : recentAvg;

  let volumeTrend: Bias = "neutral";
  if (recentAvg > prevAvg * 1.2) volumeTrend = "bullish"; // increasing volume
  else if (recentAvg < prevAvg * 0.8) volumeTrend = "bearish"; // decreasing volume

  return {
    profile,
    pointOfControl: poc.priceLevel,
    valueAreaHigh: profile[high]?.priceLevel ?? poc.priceLevel,
    valueAreaLow: profile[low]?.priceLevel ?? poc.priceLevel,
    currentVsAvg: ratio,
    volumeTrend,
  };
}
