import Anthropic from "@anthropic-ai/sdk";
import type { Signal, EvalScore } from "../../types/index.js";
import { computeEvalScore } from "../helpers.js";

const JUDGE_PROMPT = `You are an expert trading signal evaluator. You will be given a trading signal and must score it across 5 dimensions, each from 0-10.

## Scoring Rubric

### Specificity (0-10)
- 0-2: Vague prices, no specific levels mentioned
- 3-5: Some specific prices but missing context
- 6-8: Specific prices with technical level references
- 9-10: All prices reference specific technical levels with exact values

### Risk Management (0-10)
- 0-2: Missing stop loss or take profits, no position sizing
- 3-5: Has stops/targets but R:R < 2:1 or poor placement
- 6-8: Proper stops at technical levels, R:R >= 2:1, reasonable sizing
- 9-10: Excellent risk management: ATR-based stops, multiple targets, scaling plan

### Technical Confluence (0-10)
- 0-2: No indicator references or only 1 factor
- 3-5: 2 indicators mentioned but not clearly explained
- 6-8: 3+ indicators with specific values showing confluence
- 9-10: Multiple timeframe analysis, 4+ confluent factors with clear evidence

### Market Context (0-10)
- 0-2: No awareness of broader market conditions
- 3-5: Mentions market direction but no detail
- 6-8: References index levels, sector trends, sentiment
- 9-10: Comprehensive context including correlations, sector rotation, time of day

### Actionability (0-10)
- 0-2: Cannot trade on this signal (vague, missing levels)
- 3-5: Partially actionable but needs interpretation
- 6-8: Clear entry, exit, and management plan
- 9-10: Immediately executable with clear rules for every scenario

## Output Format

Return ONLY a JSON object with this exact structure:
{
  "specificity": <0-10>,
  "riskManagement": <0-10>,
  "technicalConfluence": <0-10>,
  "marketContext": <0-10>,
  "actionability": <0-10>,
  "feedback": "<1-2 sentence summary of strengths/weaknesses>"
}`;

export async function judgeSignal(signal: Signal): Promise<EvalScore> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    system: JUDGE_PROMPT,
    messages: [
      {
        role: "user",
        content: `Evaluate this trading signal:\n\n${JSON.stringify(signal, null, 2)}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in judge response");

    const scores = JSON.parse(jsonMatch[0]);

    return computeEvalScore({
      specificity: clamp(scores.specificity ?? 0),
      riskManagement: clamp(scores.riskManagement ?? 0),
      technicalConfluence: clamp(scores.technicalConfluence ?? 0),
      marketContext: clamp(scores.marketContext ?? 0),
      actionability: clamp(scores.actionability ?? 0),
    });
  } catch {
    return computeEvalScore({
      specificity: 0,
      riskManagement: 0,
      technicalConfluence: 0,
      marketContext: 0,
      actionability: 0,
    });
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)));
}
