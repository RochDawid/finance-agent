import { generateText } from "ai";
import { loadConfig } from "../../config.js";
import { createModel, getApiKey } from "../../agent/provider.js";
import type { EvalScore, ModelProvider, Signal } from "../../types/index.js";
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
  const config = loadConfig();

  // Allow overriding provider/model for local eval runs via env vars.
  // Falls back to the provider and model configured in config.yaml.
  const provider = (process.env.EVAL_PROVIDER ?? config.model.provider) as ModelProvider;
  const modelName = process.env.EVAL_MODEL ?? config.model.name;
  const apiKey = process.env.EVAL_API_KEY ?? getApiKey(provider);

  if (!apiKey) {
    throw new Error(
      `No API key for eval provider "${provider}". ` +
        `Set ${provider.toUpperCase()}_API_KEY or EVAL_API_KEY in your .env.`,
    );
  }

  const model = createModel(provider, modelName, apiKey);

  const { text } = await generateText({
    model,
    system: JUDGE_PROMPT,
    prompt: `Evaluate this trading signal:\n\n${JSON.stringify(signal, null, 2)}`,
    maxOutputTokens: 500,
  });

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
