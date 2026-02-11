import type { OHLCV, EvalScenario, Signal } from "../../types/index.js";

// Generate OHLCV data for a bullish trend scenario
function generateBullishTrend(basePrice: number, bars: number): OHLCV[] {
  const data: OHLCV[] = [];
  let price = basePrice;
  const now = Date.now();

  for (let i = 0; i < bars; i++) {
    const change = (Math.random() * 2 - 0.5) * (price * 0.01); // bias upward
    price += change;
    const high = price + Math.random() * price * 0.005;
    const low = price - Math.random() * price * 0.005;
    data.push({
      timestamp: new Date(now - (bars - i) * 86400000),
      open: price - change * 0.5,
      high,
      low,
      close: price,
      volume: 1_000_000 + Math.random() * 2_000_000,
    });
  }
  return data;
}

// Generate OHLCV data for a bearish reversal scenario
function generateBearishReversal(basePrice: number, bars: number): OHLCV[] {
  const data: OHLCV[] = [];
  let price = basePrice;
  const now = Date.now();
  const reversalPoint = Math.floor(bars * 0.6);

  for (let i = 0; i < bars; i++) {
    const bias = i < reversalPoint ? 0.3 : -0.7; // trend up then reverse
    const change = (Math.random() * 2 + bias) * (price * 0.008);
    price += change;
    const high = price + Math.random() * price * 0.005;
    const low = price - Math.random() * price * 0.005;
    data.push({
      timestamp: new Date(now - (bars - i) * 86400000),
      open: price - change * 0.5,
      high,
      low,
      close: price,
      volume: 1_000_000 + Math.random() * 3_000_000,
    });
  }
  return data;
}

// Generate range-bound OHLCV data
function generateRangeBound(basePrice: number, bars: number): OHLCV[] {
  const data: OHLCV[] = [];
  let price = basePrice;
  const now = Date.now();
  const rangeHigh = basePrice * 1.03;
  const rangeLow = basePrice * 0.97;

  for (let i = 0; i < bars; i++) {
    const change = (Math.random() * 2 - 1) * (price * 0.008);
    price = Math.max(rangeLow, Math.min(rangeHigh, price + change));
    const high = price + Math.random() * price * 0.003;
    const low = price - Math.random() * price * 0.003;
    data.push({
      timestamp: new Date(now - (bars - i) * 86400000),
      open: price - change * 0.5,
      high,
      low,
      close: price,
      volume: 500_000 + Math.random() * 1_000_000,
    });
  }
  return data;
}

export const SCENARIOS: EvalScenario[] = [
  {
    name: "AAPL Bullish Trend",
    description: "Apple in a clear uptrend with strong momentum and volume",
    ticker: "AAPL",
    assetType: "stock",
    ohlcv: generateBullishTrend(185, 100),
    expectedBias: "bullish",
    marketCondition: {
      regime: "trending_up",
      sp500Change: 0.8,
      nasdaqChange: 1.2,
      sentiment: {
        fearGreed: { value: 65, classification: "Greed", timestamp: new Date() },
      },
      timestamp: new Date(),
    },
  },
  {
    name: "TSLA Bearish Reversal",
    description: "Tesla showing bearish reversal after extended rally",
    ticker: "TSLA",
    assetType: "stock",
    ohlcv: generateBearishReversal(250, 100),
    expectedBias: "bearish",
    marketCondition: {
      regime: "high_volatility",
      sp500Change: -0.5,
      nasdaqChange: -1.1,
      sentiment: {
        fearGreed: { value: 35, classification: "Fear", timestamp: new Date() },
      },
      timestamp: new Date(),
    },
  },
  {
    name: "SPY Range-Bound",
    description: "S&P 500 ETF in a tight consolidation range, low volatility",
    ticker: "SPY",
    assetType: "etf",
    ohlcv: generateRangeBound(450, 100),
    expectedBias: "neutral",
    marketCondition: {
      regime: "range_bound",
      sp500Change: 0.1,
      nasdaqChange: -0.1,
      sentiment: {
        fearGreed: { value: 50, classification: "Neutral", timestamp: new Date() },
      },
      timestamp: new Date(),
    },
  },
  {
    name: "BTC High Volatility",
    description: "Bitcoin in high volatility regime with extreme fear",
    ticker: "bitcoin",
    assetType: "crypto",
    ohlcv: generateBearishReversal(45000, 100),
    expectedBias: "bearish",
    marketCondition: {
      regime: "high_volatility",
      sp500Change: -1.5,
      nasdaqChange: -2.0,
      sentiment: {
        fearGreed: { value: 15, classification: "Extreme Fear", timestamp: new Date() },
      },
      timestamp: new Date(),
    },
  },
];

// Well-structured example signals for testing eval logic
export const GOOD_SIGNAL: Signal = {
  ticker: "AAPL",
  assetType: "stock",
  direction: "long",
  entryPrice: 185.50,
  entryZoneHigh: 186.00,
  entryZoneLow: 185.00,
  stopLoss: 183.15,
  takeProfit1: 187.85,
  takeProfit2: 190.20,
  takeProfit3: 193.50,
  riskRewardRatio: 2.5,
  confidence: "high",
  confidenceScore: 78,
  timeframe: "1h",
  reasoning:
    "AAPL is trading at the 0.618 Fibonacci retracement ($185.40) with RSI(14) at 38.2 showing bullish divergence against price. MACD histogram has turned positive for the first time in 5 sessions. Volume is 1.3x the 20-period average, confirming buyer interest. The 50-EMA ($184.80) provides dynamic support just below entry zone. Higher timeframe (daily) shows price still above the 200-EMA, maintaining the primary uptrend.",
  confluenceFactors: [
    "Price at 0.618 Fibonacci ($185.40)",
    "RSI(14) bullish divergence at 38.2",
    "MACD histogram turning positive",
    "Volume 1.3x above 20-period average",
    "50-EMA dynamic support at $184.80",
  ],
  invalidationLevel: 182.50,
  positionSizePct: 1.5,
  timestamp: new Date().toISOString(),
};

export const BAD_SIGNAL: Signal = {
  ticker: "XYZ",
  assetType: "stock",
  direction: "long",
  entryPrice: 100,
  entryZoneHigh: 101,
  entryZoneLow: 99,
  stopLoss: 98,
  takeProfit1: 101,
  takeProfit2: 102,
  takeProfit3: 103,
  riskRewardRatio: 1.0,
  confidence: "low",
  confidenceScore: 25,
  timeframe: "1d",
  reasoning: "Looks like it might go up. Could be good.",
  confluenceFactors: ["Maybe support"],
  invalidationLevel: 97,
  positionSizePct: 5,
  timestamp: new Date().toISOString(),
};
