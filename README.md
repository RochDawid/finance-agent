# Finance Agent

AI-powered trading signal agent for day trading and scalping stocks, ETFs, and cryptocurrencies. Uses Claude as the reasoning engine with real-time market data, technical analysis, and a disciplined risk management framework.

## Architecture

```
src/
├── index.ts                  # Entry point (scan mode / dashboard mode)
├── config.ts                 # YAML config loader with env var overrides
├── types/index.ts            # Shared type definitions and Zod schemas
│
├── data/                     # Market data providers
│   ├── yahoo.ts              # Yahoo Finance — stock/ETF OHLCV and quotes
│   ├── coingecko.ts          # CoinGecko — crypto prices and OHLC
│   ├── alphavantage.ts       # Alpha Vantage — alternative stock data
│   └── sentiment.ts          # Fear & Greed Index
│
├── analysis/                 # Technical analysis engine
│   ├── indicators.ts         # Trend, momentum, volatility, volume indicators
│   ├── levels.ts             # Support/resistance, Fibonacci, pivot points
│   ├── volume.ts             # Volume profile (POC, value area)
│   └── scanner.ts            # Watchlist scanner — orchestrates data + analysis
│
├── agent/                    # Claude Agent SDK integration
│   ├── agent.ts              # Agent runner — sends analysis to Claude
│   ├── tools.ts              # 5 MCP tools the agent can call for deep-dives
│   └── prompts/
│       ├── system.ts         # Active prompt selector
│       └── versions/
│           ├── v1.ts         # Base prompt
│           └── v2.ts         # Enhanced: regime adaptation, multi-TF, session rules
│
├── dashboard/index.ts        # Ink terminal UI with live scanning
│
└── evals/                    # Evaluation suite
    ├── helpers.ts            # Deterministic signal validators
    ├── fixtures/scenarios.ts # Test fixtures and synthetic OHLCV generators
    ├── judges/trade-judge.ts # LLM-as-judge using Claude for signal scoring
    ├── signal-quality.eval.ts
    ├── risk-management.eval.ts
    └── reasoning.eval.ts     # LLM judge eval
```

## How It Works

1. **Scan** — Fetches real-time quotes and OHLCV data for your watchlist from Yahoo Finance (stocks/ETFs) and CoinGecko (crypto).
2. **Analyze** — Runs 15+ technical indicators (EMA, MACD, RSI, Bollinger Bands, ATR, OBV, VWAP, CMF, etc.), computes support/resistance levels (price action, Fibonacci, pivots), and builds a volume profile.
3. **Reason** — Sends the structured analysis to Claude via the Agent SDK. The agent can call 5 MCP tools to drill deeper into any ticker (different timeframes, levels, sentiment).
4. **Signal** — Claude applies the system prompt's trading rules (3+ confluence factors, 2:1+ R:R, volatility regime adaptation) and returns structured JSON signals with exact entry, stop loss, and 3 take-profit levels.
5. **Validate** — Signals are validated against a Zod schema to ensure structural correctness.

## Setup

### Prerequisites

- Node.js >= 24
- An [Anthropic API key](https://console.anthropic.com/)
- pnpm (recommended) or npm

### Install

```bash
git clone https://github.com/YOUR_USERNAME/finance-agent.git
cd finance-agent
pnpm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Optionally customize the watchlist and risk parameters in `config.yaml` (copy from `config.default.yaml`).

## Usage

### One-Shot Scan

Scans the full watchlist, runs AI analysis, and prints trading signals:

```bash
pnpm run scan
```

### Live Dashboard

Terminal UI that auto-refreshes on the configured interval:

```bash
pnpm run dev
```

### Evals

Run the deterministic eval suite (signal quality + risk management):

```bash
pnpm run eval
```

Run the LLM judge eval (requires `ANTHROPIC_API_KEY`):

```bash
pnpm run eval:judge
```

## System Prompt

The agent's behavior is controlled by versioned system prompts in `src/agent/prompts/versions/`. The active version is selected in `src/agent/prompts/system.ts`.

**v2** (current) includes:
- Volatility regime classification (trending, range-bound, high/low volatility) with strategy adaptation
- Mandatory multi-timeframe analysis (top-down: higher TF for bias, lower TF for entry)
- Session timing rules (opening/midday/closing for equities, session overlap for crypto)
- Asset-specific rules (earnings avoidance, ETF sector rotation, BTC dominance for alts)
- 5-category confluence system (Structure, Trend, Momentum, Volume, Pattern)
- Confidence scoring rubric (0-100 mapped to specific criteria)

## Eval Framework

The eval suite validates signal quality without calling external APIs:

| Suite | Tests | What It Checks |
|-------|-------|----------------|
| `signal-quality.eval.ts` | 13 | Schema validation, price specificity, reasoning quality, vague language detection, confluence factor count |
| `risk-management.eval.ts` | 12 | R:R ratio (>= 2:1), stop/TP ordering, position sizing limits, confidence consistency |
| `reasoning.eval.ts` | 5 | LLM-as-judge scoring across 5 dimensions: specificity, risk management, technical confluence, market context, actionability |

## Configuration

### `config.default.yaml`

```yaml
watchlist:
  stocks: [AAPL, MSFT, NVDA, TSLA, META, AMZN, SPY, QQQ]
  crypto: [bitcoin, ethereum, solana]

risk:
  maxRiskPerTrade: 0.02     # 2% of portfolio
  minRiskReward: 2.0         # 2:1 minimum
  portfolioSize: 10000
  maxOpenPositions: 5

intervals:
  scan: 300000               # 5 min scan interval (ms)
  dataRefresh: 60000          # 1 min data refresh (ms)
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `ALPHA_VANTAGE_API_KEY` | No | Alpha Vantage key (free tier: 25 req/day) |
| `COINGECKO_API_KEY` | No | CoinGecko Pro key (free tier works without) |

## Disclaimer

This software is for **educational and research purposes only**. It does not constitute financial advice. Trading involves substantial risk of loss. Past performance does not guarantee future results. Always do your own research and consult a qualified financial advisor before making investment decisions.

## License

[MIT](LICENSE)
