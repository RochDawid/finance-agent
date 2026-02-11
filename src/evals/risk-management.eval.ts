import { describe, it, expect } from "vitest";
import { GOOD_SIGNAL, BAD_SIGNAL } from "./fixtures/scenarios.js";
import { checkRiskReward, checkPositionSizing } from "./helpers.js";
import type { Signal } from "../types/index.js";

describe("Risk Management Eval", () => {
  describe("Risk/Reward Ratio", () => {
    it("good signal meets 2:1 minimum R:R", () => {
      const result = checkRiskReward(GOOD_SIGNAL);
      expect(result.valid).toBe(true);
      expect(result.actualRR).toBeGreaterThanOrEqual(2.0);
    });

    it("bad signal fails R:R check", () => {
      const result = checkRiskReward(BAD_SIGNAL);
      expect(result.valid).toBe(false);
      expect(result.actualRR).toBeLessThan(2.0);
    });

    it("validates long signal stop placement", () => {
      const badStop: Signal = { ...GOOD_SIGNAL, stopLoss: 190 }; // above entry
      const result = checkRiskReward(badStop);
      expect(result.valid).toBe(false);
      expect(result.details).toContain("Stop loss above entry");
    });

    it("validates short signal stop placement", () => {
      const shortSignal: Signal = {
        ...GOOD_SIGNAL,
        direction: "short",
        entryPrice: 190,
        stopLoss: 193, // above entry (correct for short)
        takeProfit1: 187,
        takeProfit2: 184,
        takeProfit3: 180,
      };
      const result = checkRiskReward(shortSignal);
      expect(result.valid).toBe(true);
    });

    it("rejects short signal with stop below entry", () => {
      const badShort: Signal = {
        ...GOOD_SIGNAL,
        direction: "short",
        stopLoss: 180, // below entry - wrong for short
      };
      const result = checkRiskReward(badShort);
      expect(result.valid).toBe(false);
      expect(result.details).toContain("Stop loss below entry");
    });

    it("validates TP ordering for long signals", () => {
      const badTPOrder: Signal = {
        ...GOOD_SIGNAL,
        takeProfit1: 190,
        takeProfit2: 188, // TP2 below TP1 for long
        takeProfit3: 193,
      };
      const result = checkRiskReward(badTPOrder);
      expect(result.valid).toBe(false);
    });
  });

  describe("Position Sizing", () => {
    it("good signal within position size limits", () => {
      const result = checkPositionSizing(GOOD_SIGNAL);
      expect(result.valid).toBe(true);
    });

    it("rejects oversized positions", () => {
      const oversize: Signal = { ...GOOD_SIGNAL, positionSizePct: 10 };
      const result = checkPositionSizing(oversize);
      expect(result.valid).toBe(false);
    });

    it("rejects zero or negative position size", () => {
      const zero: Signal = { ...GOOD_SIGNAL, positionSizePct: 0 };
      const result = checkPositionSizing(zero);
      expect(result.valid).toBe(false);
    });

    it("respects custom max risk parameter", () => {
      const signal: Signal = { ...GOOD_SIGNAL, positionSizePct: 1.5 };
      expect(checkPositionSizing(signal, 0.01).valid).toBe(false); // 1% max
      expect(checkPositionSizing(signal, 0.02).valid).toBe(true); // 2% max
    });
  });

  describe("Confidence Consistency", () => {
    it("high confidence should have score >= 60", () => {
      if (GOOD_SIGNAL.confidence === "high" || GOOD_SIGNAL.confidence === "very_high") {
        expect(GOOD_SIGNAL.confidenceScore).toBeGreaterThanOrEqual(60);
      }
    });

    it("low confidence should have score < 50", () => {
      if (BAD_SIGNAL.confidence === "low") {
        expect(BAD_SIGNAL.confidenceScore).toBeLessThan(50);
      }
    });
  });
});
