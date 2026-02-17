import { z } from "zod/v4";

// ─── Market Data Types ───────────────────────────────────────────────

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type AssetType = "stock" | "etf" | "crypto";

export interface Quote {
  ticker: string;
  assetType: AssetType;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  timestamp: Date;
}

// ─── Technical Analysis Types ────────────────────────────────────────

export type Bias = "bullish" | "bearish" | "neutral";

export interface IndicatorResult {
  value: number;
  interpretation: Bias;
  label: string;
}

export interface TrendIndicators {
  ema9: IndicatorResult;
  ema21: IndicatorResult;
  ema50: IndicatorResult;
  ema200: IndicatorResult;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    interpretation: Bias;
  };
  adx: IndicatorResult;
}

export interface MomentumIndicators {
  rsi: IndicatorResult;
  stochastic: {
    k: number;
    d: number;
    interpretation: Bias;
  };
  cci: IndicatorResult;
  williamsR: IndicatorResult;
}

export interface VolatilityIndicators {
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
    interpretation: Bias;
  };
  atr: IndicatorResult;
  keltnerChannels: {
    upper: number;
    middle: number;
    lower: number;
    interpretation: Bias;
  };
}

export interface VolumeIndicators {
  obv: IndicatorResult;
  vwap: IndicatorResult;
  volumeMA: IndicatorResult;
  cmf: IndicatorResult;
}

export interface TechnicalAnalysis {
  ticker: string;
  timeframe: Timeframe;
  trend: TrendIndicators;
  momentum: MomentumIndicators;
  volatility: VolatilityIndicators;
  volume: VolumeIndicators;
  overallBias: Bias;
  confluenceScore: number; // 0–10 how many indicators agree
  timestamp: Date;
}

// ─── Price Levels ────────────────────────────────────────────────────

export interface PriceLevel {
  price: number;
  type: "support" | "resistance";
  strength: "weak" | "moderate" | "strong";
  source: string; // e.g. "fibonacci_0.618", "pivot_S1", "price_action"
}

export interface FibonacciLevels {
  level0: number; // 0%   (swing high)
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
  level1000: number; // 100% (swing low)
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  type: "classic" | "camarilla";
}

export interface LevelAnalysis {
  ticker: string;
  supports: PriceLevel[];
  resistances: PriceLevel[];
  fibonacci: FibonacciLevels;
  pivots: PivotPoints;
  nearestSupport: number;
  nearestResistance: number;
}

// ─── Signal Types ────────────────────────────────────────────────────

export type SignalDirection = "long" | "short";

export type ConfidenceLevel = "low" | "medium" | "high" | "very_high";

export const SignalSchema = z.object({
  ticker: z.string(),
  assetType: z.enum(["stock", "etf", "crypto"]),
  direction: z.enum(["long", "short"]),
  entryPrice: z.number(),
  entryZoneHigh: z.number(),
  entryZoneLow: z.number(),
  stopLoss: z.number(),
  takeProfit1: z.number(),
  takeProfit2: z.number(),
  takeProfit3: z.number(),
  riskRewardRatio: z.number(),
  confidence: z.enum(["low", "medium", "high", "very_high"]),
  confidenceScore: z.number().min(0).max(100),
  timeframe: z.string(),
  reasoning: z.string(),
  confluenceFactors: z.array(z.string()),
  invalidationLevel: z.number(),
  positionSizePct: z.number().min(0).max(100),
  timestamp: z.string().datetime(),
});

export type Signal = z.infer<typeof SignalSchema>;

// ─── Sentiment Types ─────────────────────────────────────────────────

export interface FearGreedIndex {
  value: number; // 0-100
  classification: string; // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
  timestamp: Date;
}

export interface SentimentData {
  fearGreed: FearGreedIndex;
  marketBreadth?: {
    advancers: number;
    decliners: number;
    ratio: number;
    interpretation: Bias;
  };
}

// ─── Market Condition ────────────────────────────────────────────────

export type MarketRegime = "trending_up" | "trending_down" | "range_bound" | "high_volatility" | "low_volatility";

export interface MarketCondition {
  regime: MarketRegime;
  sp500Change: number;
  nasdaqChange: number;
  vixLevel?: number;
  btcDominance?: number;
  sentiment: SentimentData;
  sentimentUnavailable?: boolean;
  timestamp: Date;
}

// ─── Analysis Report ─────────────────────────────────────────────────

export interface AnalysisReport {
  ticker: string;
  assetType: AssetType;
  quote: Quote;
  technicals: TechnicalAnalysis;
  levels: LevelAnalysis;
  marketCondition: MarketCondition;
  timestamp: Date;
}

// ─── Configuration ───────────────────────────────────────────────────

export interface RiskParams {
  maxRiskPerTrade: number;
  minRiskReward: number;
  portfolioSize: number;
  maxOpenPositions?: number;
  maxCorrelatedPositions?: number;
}

export type ModelProvider = "anthropic" | "openai" | "google";

export interface ModelConfig {
  provider: ModelProvider;
  name: string;
}

export interface AppConfig {
  watchlist: {
    stocks: string[];
    crypto: string[];
  };
  risk: RiskParams;
  intervals: {
    analysis: number;
    dataRefresh: number;
  };
  model: ModelConfig;
  apiKeys: {
    alphaVantage?: string;
    coinGecko?: string;
  };
}

// ─── Eval Types ──────────────────────────────────────────────────────

export interface EvalScore {
  specificity: number;
  riskManagement: number;
  technicalConfluence: number;
  marketContext: number;
  actionability: number;
  total: number;
  maxTotal: number;
  pass: boolean;
  feedback: string;
}

export interface EvalScenario {
  name: string;
  description: string;
  ticker: string;
  assetType: AssetType;
  ohlcv: OHLCV[];
  expectedBias: Bias;
  marketCondition: MarketCondition;
}
