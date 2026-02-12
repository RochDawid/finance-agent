
import { describe, expect, it } from "vitest";
import { BAD_SIGNAL, GOOD_SIGNAL } from "./fixtures/scenarios.js";
import { judgeSignal } from "./judges/trade-judge.js";

describe("Reasoning Quality Eval (LLM Judge)", () => {
  it(
    "good signal scores above passing threshold",
    async () => {
      const score = await judgeSignal(GOOD_SIGNAL);
      console.log("Good signal scores:", {
        specificity: score.specificity,
        riskManagement: score.riskManagement,
        technicalConfluence: score.technicalConfluence,
        marketContext: score.marketContext,
        actionability: score.actionability,
        total: `${score.total}/${score.maxTotal}`,
        pass: score.pass,
        feedback: score.feedback,
      });
      expect(score.pass).toBe(true);
      expect(score.total).toBeGreaterThanOrEqual(30);
    }
  );

  it(
    "bad signal scores below good signal",
    async () => {
      const goodScore = await judgeSignal(GOOD_SIGNAL);
      const badScore = await judgeSignal(BAD_SIGNAL);
      console.log("Bad signal scores:", {
        specificity: badScore.specificity,
        riskManagement: badScore.riskManagement,
        technicalConfluence: badScore.technicalConfluence,
        marketContext: badScore.marketContext,
        actionability: badScore.actionability,
        total: `${badScore.total}/${badScore.maxTotal}`,
        pass: badScore.pass,
        feedback: badScore.feedback,
      });
      expect(badScore.total).toBeLessThan(goodScore.total);
    }
  );

  it(
    "good signal has high specificity score",
    async () => {
      const score = await judgeSignal(GOOD_SIGNAL);
      expect(score.specificity).toBeGreaterThanOrEqual(6);
    }
  );

  it(
    "good signal has high risk management score",
    async () => {
      const score = await judgeSignal(GOOD_SIGNAL);
      expect(score.riskManagement).toBeGreaterThanOrEqual(6);
    }
  );

  it(
    "good signal has high actionability score",
    async () => {
      const score = await judgeSignal(GOOD_SIGNAL);
      expect(score.actionability).toBeGreaterThanOrEqual(6);
    }
  );
});
