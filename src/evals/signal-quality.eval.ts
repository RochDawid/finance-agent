import { describe, it, expect } from "vitest";
import { GOOD_SIGNAL, BAD_SIGNAL } from "./fixtures/scenarios.js";
import {
  validateSignalStructure,
  hasSpecificPrices,
  hasConcreteReasoning,
} from "./helpers.js";

describe("Signal Quality Eval", () => {
  describe("Signal Structure", () => {
    it("good signal passes schema validation", () => {
      const result = validateSignalStructure(GOOD_SIGNAL);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects signal with missing fields", () => {
      const incomplete = { ticker: "AAPL", direction: "long" };
      const result = validateSignalStructure(incomplete);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects signal with invalid direction", () => {
      const invalid = { ...GOOD_SIGNAL, direction: "sideways" };
      const result = validateSignalStructure(invalid);
      expect(result.valid).toBe(false);
    });

    it("rejects signal with invalid confidence", () => {
      const invalid = { ...GOOD_SIGNAL, confidence: "maybe" };
      const result = validateSignalStructure(invalid);
      expect(result.valid).toBe(false);
    });
  });

  describe("Price Specificity", () => {
    it("good signal has all specific prices", () => {
      const result = hasSpecificPrices(GOOD_SIGNAL);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("detects missing/zero prices", () => {
      const zeroPrice = { ...GOOD_SIGNAL, takeProfit3: 0 };
      const result = hasSpecificPrices(zeroPrice);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("takeProfit3");
    });
  });

  describe("Reasoning Quality", () => {
    it("good signal has concrete reasoning", () => {
      const result = hasConcreteReasoning(GOOD_SIGNAL);
      expect(result.score).toBeGreaterThanOrEqual(7);
      expect(result.issues).toHaveLength(0);
    });

    it("bad signal has poor reasoning", () => {
      const result = hasConcreteReasoning(BAD_SIGNAL);
      expect(result.score).toBeLessThan(7);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("detects vague language", () => {
      const vague = {
        ...GOOD_SIGNAL,
        reasoning: "I think this might go up. Could potentially be a good trade. Looks okay.",
      };
      const result = hasConcreteReasoning(vague);
      expect(result.issues.some((i) => i.includes("vague"))).toBe(true);
    });

    it("requires minimum confluence factors", () => {
      const lowConfluence = {
        ...GOOD_SIGNAL,
        confluenceFactors: ["One factor"],
      };
      const result = hasConcreteReasoning(lowConfluence);
      expect(result.issues.some((i) => i.includes("confluence"))).toBe(true);
    });
  });

  describe("Price Consistency", () => {
    it("long signal: stop < entry < TP1 < TP2 < TP3", () => {
      expect(GOOD_SIGNAL.stopLoss).toBeLessThan(GOOD_SIGNAL.entryPrice);
      expect(GOOD_SIGNAL.entryPrice).toBeLessThan(GOOD_SIGNAL.takeProfit1);
      expect(GOOD_SIGNAL.takeProfit1).toBeLessThan(GOOD_SIGNAL.takeProfit2);
      expect(GOOD_SIGNAL.takeProfit2).toBeLessThan(GOOD_SIGNAL.takeProfit3);
    });

    it("entry zone brackets the entry price", () => {
      expect(GOOD_SIGNAL.entryZoneLow).toBeLessThanOrEqual(GOOD_SIGNAL.entryPrice);
      expect(GOOD_SIGNAL.entryZoneHigh).toBeGreaterThanOrEqual(GOOD_SIGNAL.entryPrice);
    });

    it("invalidation is below stop loss for longs", () => {
      expect(GOOD_SIGNAL.invalidationLevel).toBeLessThanOrEqual(GOOD_SIGNAL.stopLoss);
    });
  });
});
