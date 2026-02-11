import type {
  OHLCV,
  PriceLevel,
  FibonacciLevels,
  PivotPoints,
  LevelAnalysis,
} from "../types/index.js";

// ─── Support / Resistance from Price Action ──────────────────────────

export function findSupportResistance(
  data: OHLCV[],
  lookback: number = 20,
  tolerance: number = 0.005,
): PriceLevel[] {
  const levels: PriceLevel[] = [];
  const recentData = data.slice(-lookback * 3);

  // Find swing highs and lows
  for (let i = 2; i < recentData.length - 2; i++) {
    const bar = recentData[i];

    // Swing high
    if (
      bar.high > recentData[i - 1].high &&
      bar.high > recentData[i - 2].high &&
      bar.high > recentData[i + 1].high &&
      bar.high > recentData[i + 2].high
    ) {
      levels.push({
        price: bar.high,
        type: "resistance",
        strength: "moderate",
        source: "price_action_swing_high",
      });
    }

    // Swing low
    if (
      bar.low < recentData[i - 1].low &&
      bar.low < recentData[i - 2].low &&
      bar.low < recentData[i + 1].low &&
      bar.low < recentData[i + 2].low
    ) {
      levels.push({
        price: bar.low,
        type: "support",
        strength: "moderate",
        source: "price_action_swing_low",
      });
    }
  }

  // Cluster nearby levels to increase strength
  return clusterLevels(levels, tolerance);
}

function clusterLevels(levels: PriceLevel[], tolerance: number): PriceLevel[] {
  if (levels.length === 0) return [];

  const sorted = [...levels].sort((a, b) => a.price - b.price);
  const clusters: PriceLevel[] = [];
  let current = sorted[0];
  let count = 1;

  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.abs(sorted[i].price - current.price) / current.price;
    if (diff < tolerance) {
      count++;
      // Average the price
      current = {
        ...current,
        price: (current.price + sorted[i].price) / 2,
        strength: count >= 3 ? "strong" : count >= 2 ? "moderate" : "weak",
      };
    } else {
      clusters.push(current);
      current = sorted[i];
      count = 1;
    }
  }
  clusters.push(current);

  return clusters;
}

// ─── Fibonacci Retracements ──────────────────────────────────────────

export function computeFibonacci(data: OHLCV[], lookback: number = 50): FibonacciLevels {
  const recentData = data.slice(-lookback);
  const high = Math.max(...recentData.map((d) => d.high));
  const low = Math.min(...recentData.map((d) => d.low));
  const range = high - low;

  return {
    level0: high,
    level236: high - range * 0.236,
    level382: high - range * 0.382,
    level500: high - range * 0.5,
    level618: high - range * 0.618,
    level786: high - range * 0.786,
    level1000: low,
  };
}

export function fibLevelsToPrice(fib: FibonacciLevels): PriceLevel[] {
  return [
    { price: fib.level236, type: "support", strength: "weak", source: "fibonacci_0.236" },
    { price: fib.level382, type: "support", strength: "moderate", source: "fibonacci_0.382" },
    { price: fib.level500, type: "support", strength: "moderate", source: "fibonacci_0.500" },
    { price: fib.level618, type: "support", strength: "strong", source: "fibonacci_0.618" },
    { price: fib.level786, type: "support", strength: "moderate", source: "fibonacci_0.786" },
  ];
}

// ─── Pivot Points ────────────────────────────────────────────────────

export function computeClassicPivots(data: OHLCV[]): PivotPoints {
  // Use the previous day's data
  const prev = data[data.length - 2] ?? data[data.length - 1];
  const H = prev.high;
  const L = prev.low;
  const C = prev.close;

  const pivot = (H + L + C) / 3;

  return {
    pivot,
    r1: 2 * pivot - L,
    r2: pivot + (H - L),
    r3: H + 2 * (pivot - L),
    s1: 2 * pivot - H,
    s2: pivot - (H - L),
    s3: L - 2 * (H - pivot),
    type: "classic",
  };
}

export function computeCamarillaPivots(data: OHLCV[]): PivotPoints {
  const prev = data[data.length - 2] ?? data[data.length - 1];
  const H = prev.high;
  const L = prev.low;
  const C = prev.close;
  const range = H - L;

  return {
    pivot: (H + L + C) / 3,
    r1: C + range * (1.1 / 12),
    r2: C + range * (1.1 / 6),
    r3: C + range * (1.1 / 4),
    s1: C - range * (1.1 / 12),
    s2: C - range * (1.1 / 6),
    s3: C - range * (1.1 / 4),
    type: "camarilla",
  };
}

function pivotsToLevels(pivots: PivotPoints): PriceLevel[] {
  return [
    { price: pivots.r3, type: "resistance", strength: "strong", source: `pivot_${pivots.type}_R3` },
    { price: pivots.r2, type: "resistance", strength: "moderate", source: `pivot_${pivots.type}_R2` },
    { price: pivots.r1, type: "resistance", strength: "weak", source: `pivot_${pivots.type}_R1` },
    { price: pivots.pivot, type: "support", strength: "moderate", source: `pivot_${pivots.type}_PP` },
    { price: pivots.s1, type: "support", strength: "weak", source: `pivot_${pivots.type}_S1` },
    { price: pivots.s2, type: "support", strength: "moderate", source: `pivot_${pivots.type}_S2` },
    { price: pivots.s3, type: "support", strength: "strong", source: `pivot_${pivots.type}_S3` },
  ];
}

// ─── Full Level Analysis ─────────────────────────────────────────────

export function computeLevelAnalysis(ticker: string, data: OHLCV[]): LevelAnalysis {
  const currentPrice = data[data.length - 1].close;

  const priceActionLevels = findSupportResistance(data);
  const fibonacci = computeFibonacci(data);
  const fibLevels = fibLevelsToPrice(fibonacci);
  const pivots = computeClassicPivots(data);
  const pivotLevels = pivotsToLevels(pivots);

  const allLevels = [...priceActionLevels, ...fibLevels, ...pivotLevels];

  const supports = allLevels
    .filter((l) => l.type === "support" && l.price < currentPrice)
    .sort((a, b) => b.price - a.price); // nearest first

  const resistances = allLevels
    .filter((l) => l.type === "resistance" && l.price > currentPrice)
    .sort((a, b) => a.price - b.price); // nearest first

  return {
    ticker,
    supports,
    resistances,
    fibonacci,
    pivots,
    nearestSupport: supports[0]?.price ?? currentPrice * 0.98,
    nearestResistance: resistances[0]?.price ?? currentPrice * 1.02,
  };
}
