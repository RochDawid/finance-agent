import {
  ADX,
  ATR,
  BollingerBands,
  CCI,
  EMA,
  MACD,
  OBV,
  RSI,
  SMA,
  Stochastic,
  VWAP,
  WilliamsR,
} from "technicalindicators";
import type {
  Bias,
  MomentumIndicators,
  OHLCV,
  TechnicalAnalysis,
  Timeframe,
  TrendIndicators,
  VolatilityIndicators,
  VolumeIndicators
} from "../types/index.js";

// ─── Helpers ─────────────────────────────────────────────────────────

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

function emaBias(price: number, emaValue: number): Bias {
  const pctDiff = ((price - emaValue) / emaValue) * 100;
  if (pctDiff > 0.5) return "bullish";
  if (pctDiff < -0.5) return "bearish";
  return "neutral";
}

function rsiBias(value: number): Bias {
  if (value > 70) return "bearish"; // overbought
  if (value < 30) return "bullish"; // oversold
  if (value > 55) return "bullish";
  if (value < 45) return "bearish";
  return "neutral";
}

// ─── Trend Indicators ────────────────────────────────────────────────

export function computeTrend(data: OHLCV[]): TrendIndicators {
  const closes = data.map((d) => d.close);
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const price = last(closes) ?? 0;

  const ema9Values = EMA.calculate({ period: 9, values: closes });
  const ema21Values = EMA.calculate({ period: 21, values: closes });
  const ema50Values = EMA.calculate({ period: 50, values: closes });
  const ema200Values = EMA.calculate({ period: 200, values: closes });

  const macdResult = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const adxResult = ADX.calculate({
    close: closes,
    high: highs,
    low: lows,
    period: 14,
  });

  const macdLast = last(macdResult);
  const adxLast = last(adxResult);

  const macdLine = macdLast?.MACD ?? 0;
  const signalLine = macdLast?.signal ?? 0;
  const histogram = macdLast?.histogram ?? 0;

  let macdBias: Bias = "neutral";
  if (histogram > 0 && macdLine > signalLine) macdBias = "bullish";
  else if (histogram < 0 && macdLine < signalLine) macdBias = "bearish";

  const adxValue = adxLast?.adx ?? 0;
  let adxBias: Bias = "neutral";
  if (adxValue > 25) {
    adxBias = (adxLast?.pdi ?? 0) > (adxLast?.mdi ?? 0) ? "bullish" : "bearish";
  }

  return {
    ema9: {
      value: last(ema9Values) ?? 0,
      interpretation: emaBias(price, last(ema9Values) ?? price),
      label: "EMA 9",
    },
    ema21: {
      value: last(ema21Values) ?? 0,
      interpretation: emaBias(price, last(ema21Values) ?? price),
      label: "EMA 21",
    },
    ema50: {
      value: last(ema50Values) ?? 0,
      interpretation: emaBias(price, last(ema50Values) ?? price),
      label: "EMA 50",
    },
    ema200: {
      value: last(ema200Values) ?? 0,
      interpretation: emaBias(price, last(ema200Values) ?? price),
      label: "EMA 200",
    },
    macd: {
      macdLine,
      signalLine,
      histogram,
      interpretation: macdBias,
    },
    adx: {
      value: adxValue,
      interpretation: adxBias,
      label: "ADX",
    },
  };
}

// ─── Momentum Indicators ─────────────────────────────────────────────

export function computeMomentum(data: OHLCV[]): MomentumIndicators {
  const closes = data.map((d) => d.close);
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);

  const rsiValues = RSI.calculate({ period: 14, values: closes });
  const rsiValue = last(rsiValues) ?? 50;

  const stochResult = Stochastic.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
    signalPeriod: 3,
  });
  const stochLast = last(stochResult);
  const stochK = stochLast?.k ?? 50;
  const stochD = stochLast?.d ?? 50;

  let stochBias: Bias = "neutral";
  if (stochK > 80) stochBias = "bearish";
  else if (stochK < 20) stochBias = "bullish";
  else if (stochK > stochD) stochBias = "bullish";
  else if (stochK < stochD) stochBias = "bearish";

  const cciValues = CCI.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 20,
  });
  const cciValue = last(cciValues) ?? 0;

  let cciBias: Bias = "neutral";
  if (cciValue > 100) cciBias = "bullish";
  else if (cciValue < -100) cciBias = "bearish";

  const wrValues = WilliamsR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
  });
  const wrValue = last(wrValues) ?? -50;

  let wrBias: Bias = "neutral";
  if (wrValue > -20) wrBias = "bearish"; // overbought
  else if (wrValue < -80) wrBias = "bullish"; // oversold

  return {
    rsi: {
      value: rsiValue,
      interpretation: rsiBias(rsiValue),
      label: "RSI (14)",
    },
    stochastic: {
      k: stochK,
      d: stochD,
      interpretation: stochBias,
    },
    cci: {
      value: cciValue,
      interpretation: cciBias,
      label: "CCI (20)",
    },
    williamsR: {
      value: wrValue,
      interpretation: wrBias,
      label: "Williams %R (14)",
    },
  };
}

// ─── Volatility Indicators ───────────────────────────────────────────

export function computeVolatility(data: OHLCV[]): VolatilityIndicators {
  const closes = data.map((d) => d.close);
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const price = last(closes) ?? 0;

  const bbResult = BollingerBands.calculate({
    period: 20,
    values: closes,
    stdDev: 2,
  });
  const bbLast = last(bbResult);
  const bbUpper = bbLast?.upper ?? price;
  const bbMiddle = bbLast?.middle ?? price;
  const bbLower = bbLast?.lower ?? price;
  const bandwidth = bbUpper - bbLower;
  const percentB = bandwidth > 0 ? (price - bbLower) / bandwidth : 0.5;

  let bbBias: Bias = "neutral";
  if (percentB > 0.8) bbBias = "bearish"; // near upper band
  else if (percentB < 0.2) bbBias = "bullish"; // near lower band

  const atrValues = ATR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
  });
  const atrValue = last(atrValues) ?? 0;
  const atrPct = price > 0 ? (atrValue / price) * 100 : 0;

  let atrBias: Bias = "neutral";
  if (atrPct > 3) atrBias = "bearish"; // high volatility
  else if (atrPct < 1) atrBias = "bullish"; // low volatility, potential breakout

  // Keltner Channels: EMA(20) ± 2 * ATR(10)
  const keltnerEMA = last(EMA.calculate({ period: 20, values: closes })) ?? price;
  const keltnerATR =
    last(ATR.calculate({ high: highs, low: lows, close: closes, period: 10 })) ?? 0;
  const keltnerUpper = keltnerEMA + 2 * keltnerATR;
  const keltnerLower = keltnerEMA - 2 * keltnerATR;

  let keltnerBias: Bias = "neutral";
  if (price > keltnerUpper) keltnerBias = "bullish"; // breakout above
  else if (price < keltnerLower) keltnerBias = "bearish"; // breakdown below

  return {
    bollingerBands: {
      upper: bbUpper,
      middle: bbMiddle,
      lower: bbLower,
      bandwidth,
      percentB,
      interpretation: bbBias,
    },
    atr: {
      value: atrValue,
      interpretation: atrBias,
      label: "ATR (14)",
    },
    keltnerChannels: {
      upper: keltnerUpper,
      middle: keltnerEMA,
      lower: keltnerLower,
      interpretation: keltnerBias,
    },
  };
}

// ─── Volume Indicators ───────────────────────────────────────────────

export function computeVolume(data: OHLCV[]): VolumeIndicators {
  const closes = data.map((d) => d.close);
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const volumes = data.map((d) => d.volume);
  const currentVolume = last(volumes) ?? 0;

  // OBV
  const obvValues = OBV.calculate({ close: closes, volume: volumes });
  const obvValue = last(obvValues) ?? 0;
  const obvPrev = (obvValues.length > 1 ? obvValues[obvValues.length - 2] : undefined) ?? obvValue;
  let obvBias: Bias = "neutral";
  if (obvValue > obvPrev) obvBias = "bullish";
  else if (obvValue < obvPrev) obvBias = "bearish";

  // VWAP
  const vwapValues = VWAP.calculate({
    high: highs,
    low: lows,
    close: closes,
    volume: volumes,
  });
  const price = last(closes) ?? 0;
  const vwapValue = last(vwapValues) ?? price;
  
  let vwapBias: Bias = "neutral";
  if (price > vwapValue * 1.005) vwapBias = "bullish";
  else if (price < vwapValue * 0.995) vwapBias = "bearish";

  // Volume Moving Average (20-period)
  const volumeMA = last(SMA.calculate({ period: 20, values: volumes })) ?? currentVolume;
  const volRatio = volumeMA > 0 ? currentVolume / volumeMA : 1;
  let volMABias: Bias = "neutral";
  if (volRatio > 1.5) volMABias = "bullish"; // above-average volume
  else if (volRatio < 0.5) volMABias = "bearish"; // below-average volume

  // Chaikin Money Flow (CMF) - simplified calculation
  const cmfPeriod = 20;
  const recentData = data.slice(-cmfPeriod);
  let mfvSum = 0;
  let volSum = 0;
  for (const bar of recentData) {
    const range = bar.high - bar.low;
    const mfMultiplier = range > 0 ? ((bar.close - bar.low) - (bar.high - bar.close)) / range : 0;
    mfvSum += mfMultiplier * bar.volume;
    volSum += bar.volume;
  }
  const cmfValue = volSum > 0 ? mfvSum / volSum : 0;

  let cmfBias: Bias = "neutral";
  if (cmfValue > 0.1) cmfBias = "bullish";
  else if (cmfValue < -0.1) cmfBias = "bearish";

  return {
    obv: { value: obvValue, interpretation: obvBias, label: "OBV" },
    vwap: { value: vwapValue, interpretation: vwapBias, label: "VWAP" },
    volumeMA: { value: volumeMA, interpretation: volMABias, label: "Vol MA (20)" },
    cmf: { value: cmfValue, interpretation: cmfBias, label: "CMF (20)" },
  };
}

// ─── Full Technical Analysis ─────────────────────────────────────────

export function computeTechnicalAnalysis(
  ticker: string,
  data: OHLCV[],
  timeframe: Timeframe,
): TechnicalAnalysis {
  const trend = computeTrend(data);
  const momentum = computeMomentum(data);
  const volatility = computeVolatility(data);
  const volume = computeVolume(data);

  // Count bullish/bearish indicators for confluence
  const allBiases: Bias[] = [
    trend.ema9.interpretation,
    trend.ema21.interpretation,
    trend.ema50.interpretation,
    trend.macd.interpretation,
    trend.adx.interpretation,
    momentum.rsi.interpretation,
    momentum.stochastic.interpretation,
    momentum.cci.interpretation,
    volatility.bollingerBands.interpretation,
    volume.obv.interpretation,
    volume.vwap.interpretation,
    volume.cmf.interpretation,
  ];

  const bullishCount = allBiases.filter((b) => b === "bullish").length;
  const bearishCount = allBiases.filter((b) => b === "bearish").length;
  const total = allBiases.length;

  let overallBias: Bias = "neutral";
  if (bullishCount > total * 0.6) overallBias = "bullish";
  else if (bearishCount > total * 0.6) overallBias = "bearish";

  const dominantCount = Math.max(bullishCount, bearishCount);
  const confluenceScore = Math.round((dominantCount / total) * 10);

  return {
    ticker,
    timeframe,
    trend,
    momentum,
    volatility,
    volume,
    overallBias,
    confluenceScore,
    timestamp: new Date(),
  };
}
