import { SignalSchema, type EvalScore, type Signal } from "../types/index.js";

export function validateSignalStructure(signal: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    SignalSchema.parse(signal);
    return { valid: true, errors: [] };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      const zodErr = err as { issues: Array<{ path: (string | number)[]; message: string }> };
      for (const issue of zodErr.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    } else {
      errors.push(String(err));
    }
    return { valid: false, errors };
  }
}

export function checkRiskReward(signal: Signal): {
  valid: boolean;
  actualRR: number;
  details: string;
} {
  const entryToStop = Math.abs(signal.entryPrice - signal.stopLoss);
  const entryToTP2 = Math.abs(signal.takeProfit2 - signal.entryPrice);
  const actualRR = entryToStop > 0 ? entryToTP2 / entryToStop : 0;

  if (signal.direction === "long") {
    if (signal.stopLoss >= signal.entryPrice) {
      return { valid: false, actualRR, details: "Stop loss above entry for long signal" };
    }
    if (signal.takeProfit1 <= signal.entryPrice) {
      return { valid: false, actualRR, details: "TP1 below entry for long signal" };
    }
    if (signal.takeProfit2 <= signal.takeProfit1) {
      return { valid: false, actualRR, details: "TP2 should be above TP1 for long signal" };
    }
    if (signal.takeProfit3 <= signal.takeProfit2) {
      return { valid: false, actualRR, details: "TP3 should be above TP2 for long signal" };
    }
  } else {
    if (signal.stopLoss <= signal.entryPrice) {
      return { valid: false, actualRR, details: "Stop loss below entry for short signal" };
    }
    if (signal.takeProfit1 >= signal.entryPrice) {
      return { valid: false, actualRR, details: "TP1 above entry for short signal" };
    }
    if (signal.takeProfit2 >= signal.takeProfit1) {
      return { valid: false, actualRR, details: "TP2 should be below TP1 for short signal" };
    }
    if (signal.takeProfit3 >= signal.takeProfit2) {
      return { valid: false, actualRR, details: "TP3 should be below TP2 for short signal" };
    }
  }

  // Use small epsilon for floating-point comparison
  const meetsMinimum = actualRR >= 2.0 - 1e-9;
  return {
    valid: meetsMinimum,
    actualRR,
    details: meetsMinimum ? "R:R meets minimum" : `R:R ${actualRR.toFixed(2)} below 2.0 minimum`,
  };
}

export function checkPositionSizing(signal: Signal, maxRiskPct: number = 0.02): {
  valid: boolean;
  details: string;
} {
  if (signal.positionSizePct > maxRiskPct * 100) {
    return {
      valid: false,
      details: `Position size ${signal.positionSizePct}% exceeds max risk ${maxRiskPct * 100}%`,
    };
  }
  if (signal.positionSizePct <= 0) {
    return { valid: false, details: "Position size must be positive" };
  }
  return { valid: true, details: "Position sizing within limits" };
}

export function hasSpecificPrices(signal: Signal): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  const priceFields: (keyof Signal)[] = [
    "entryPrice",
    "stopLoss",
    "takeProfit1",
    "takeProfit2",
    "takeProfit3",
    "invalidationLevel",
  ];

  for (const field of priceFields) {
    const val = signal[field];
    if (typeof val !== "number" || val <= 0 || !isFinite(val)) {
      missing.push(field);
    }
  }

  return { valid: missing.length === 0, missing };
}

export function hasConcreteReasoning(signal: Signal): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 10;

  // Check reasoning length
  if (signal.reasoning.length < 50) {
    issues.push("Reasoning too short (< 50 chars)");
    score -= 3;
  }

  // Check for vague language
  const vagueTerms = [
    "might", "could potentially", "seems like", "I think",
    "maybe", "possibly", "looks okay", "not bad",
  ];
  for (const term of vagueTerms) {
    if (signal.reasoning.toLowerCase().includes(term)) {
      issues.push(`Contains vague language: "${term}"`);
      score -= 1;
    }
  }

  // Check for specific numbers in reasoning
  const numberPattern = /\d+\.?\d*/g;
  const numbers = signal.reasoning.match(numberPattern);
  if (!numbers || numbers.length < 2) {
    issues.push("Reasoning lacks specific numerical values");
    score -= 2;
  }

  // Check confluence factors
  if (signal.confluenceFactors.length < 3) {
    issues.push(`Only ${signal.confluenceFactors.length} confluence factors (need 3+)`);
    score -= 2;
  }

  return { score: Math.max(0, score), issues };
}

export function computeEvalScore(scores: {
  specificity: number;
  riskManagement: number;
  technicalConfluence: number;
  marketContext: number;
  actionability: number;
}): EvalScore {
  const total =
    scores.specificity +
    scores.riskManagement +
    scores.technicalConfluence +
    scores.marketContext +
    scores.actionability;
  const maxTotal = 50;

  return {
    ...scores,
    total,
    maxTotal,
    pass: total >= 30, // 60% threshold
    feedback:
      total >= 40
        ? "Excellent signal quality"
        : total >= 30
          ? "Acceptable signal quality"
          : "Signal quality below threshold — improve specificity and risk management",
  };
}
