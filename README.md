# Finance Agent

AI-powered trading signal agent for day trading and scalping stocks, ETFs, and cryptocurrencies. Supports Anthropic Claude, OpenAI GPT, and Google Gemini as reasoning engines, combined with real-time market data, technical analysis, and a disciplined risk management framework.

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
├── agent/                    # AI agent integration
│   ├── agent.ts              # Agent runner — sends analysis to the configured model
│   ├── provider.ts           # Model factory — creates Anthropic / OpenAI / Google clients
│   ├── tools.ts              # 5 tools the agent can call for deep-dives
│   └── prompts/
│       ├── system.ts         # Active prompt selector
│       └── versions/
│           ├── v1.ts         # Base prompt
│           └── v2.ts         # Enhanced: regime adaptation, multi-TF, session rules
│
├── dashboard/index.ts        # Console terminal UI with live scanning
│
└── evals/                    # Evaluation suite
    ├── helpers.ts            # Deterministic signal validators
    ├── fixtures/scenarios.ts # Test fixtures and synthetic OHLCV generators
    ├── judges/trade-judge.ts # LLM-as-judge for signal scoring
    ├── signal-quality.eval.ts
    ├── risk-management.eval.ts
    └── reasoning.eval.ts     # LLM judge eval

web/                          # Next.js 15 web dashboard
├── app/                      # App Router pages
│   ├── page.tsx              # Main dashboard
│   ├── details/[ticker]/     # Ticker detail page
│   ├── signals/[id]/         # Signal detail page
│   ├── history/              # Signal history
│   ├── settings/             # Settings (model, risk params, API keys)
│   └── watchlist/            # Watchlist management
├── components/               # UI component library
│   ├── charts/               # Candlestick chart, sparklines, Fear & Greed gauge
│   ├── data/                 # Indicator panels, levels table, price display
│   ├── layout/               # App shell, header, sidebar, command palette
│   ├── market/               # Market overview, index changes
│   ├── signals/              # Signal cards, detail panel, entry zone visual
│   └── ui/                   # Radix UI primitives (shadcn-style)
├── hooks/                    # use-keyboard-shortcuts, use-ohlcv, use-ticker-data
├── lib/                      # WebSocket server, scan loop, cache, providers
└── server.ts                 # Next.js + WebSocket server entrypoint
```

## How It Works

1. **Scan** — Fetches real-time quotes and OHLCV data for your watchlist from Yahoo Finance (stocks/ETFs) and CoinGecko (crypto). Supports selective scanning of a subset of tickers.
2. **Analyze** — Runs 15+ technical indicators (EMA, MACD, RSI, Bollinger Bands, ATR, OBV, VWAP, CMF, etc.), computes support/resistance levels (price action, Fibonacci, pivots), and builds a volume profile.
3. **Reason** — Sends the structured analysis to the configured AI model via the Vercel AI SDK. The agent can call 5 tools to drill deeper into any ticker (different timeframes, levels, sentiment).
4. **Signal** — The model applies the system prompt's trading rules (3+ confluence factors, 2.5:1+ R:R, volatility regime adaptation) and returns structured JSON signals with exact entry, stop loss, and 3 take-profit levels.
5. **Validate** — Signals are validated against a Zod schema to ensure structural correctness.
6. **Display** — Results are shown in the terminal console UI or streamed live to the Next.js web dashboard via WebSocket.

## Setup

### Prerequisites

- Node.js >= 24
- An API key for at least one supported provider: [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/), or [Google AI](https://aistudio.google.com/)

### Install

```bash
git clone https://github.com/YOUR_USERNAME/finance-agent.git
cd finance-agent
npm install
cd web && npm install
```

### Configure

```bash
cp .env.example .env
```

Add the API key for your chosen provider:

```
# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-...

# Google Gemini
GOOGLE_API_KEY=...
```

Copy and customize the config file:

```bash
cp config.default.yaml config.yaml
```

Set the provider and model in `config.yaml`:

```yaml
model:
  provider: anthropic   # anthropic | openai | google
  name: claude-opus-4-6
```

Other provider examples:

```yaml
model:
  provider: openai
  name: gpt-4o
```

```yaml
model:
  provider: google
  name: gemini-2.0-flash
```

The agent automatically enables extended thinking for Anthropic models that support it. Provider and model can also be changed at runtime from the web UI under **Settings → Model**.

## Usage

### Terminal Dashboard

Console UI that auto-refreshes on the configured interval:

```bash
npm run dev
```

### One-Shot Analysis

Scans the full watchlist, runs AI analysis, and prints trading signals:

```bash
npm run analyze
```

### Web Dashboard

Next.js web dashboard with real-time WebSocket updates, candlestick charts, and interactive signal panels:

```bash
cd web && npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Evals

Run the deterministic eval suite (signal quality + risk management):

```bash
npm run eval
```

Run the LLM judge eval. By default it uses the provider configured in `config.yaml`. Override with env vars to use a different model for judging:

```bash
# Use the configured provider
npm run eval:judge

# Override provider and model for the judge
EVAL_PROVIDER=openai EVAL_MODEL=gpt-4o npm run eval:judge

# Use a separate API key just for evals
EVAL_API_KEY=sk-... npm run eval:judge
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

The eval suite validates signal quality without calling external APIs (except `reasoning.eval.ts`):

| Suite | Tests | What It Checks |
|-------|-------|----------------|
| `signal-quality.eval.ts` | 13 | Schema validation, price specificity, reasoning quality, vague language detection, confluence factor count |
| `risk-management.eval.ts` | 12 | R:R ratio (>= 2.5:1), stop/TP ordering, position sizing limits, confidence consistency |
| `reasoning.eval.ts` | 5 | LLM-as-judge scoring across 5 dimensions: specificity, risk management, technical confluence, market context, actionability |

## Configuration

### `config.default.yaml`

```yaml
watchlist:
  stocks: [PLTR]
  crypto: [bitcoin]

risk:
  maxRiskPerTrade: 0.05     # 5% of portfolio
  minRiskReward: 2.5        # 2.5:1 minimum
  portfolioSize: 500
  maxOpenPositions: 3
  maxCorrelatedPositions: 2

intervals:
  scan: 300000               # 5 min scan interval (ms)
  dataRefresh: 60000         # 1 min data refresh (ms)

model:
  provider: anthropic        # anthropic | openai | google
  name: claude-opus-4-6
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | If using Anthropic | Claude API key |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI API key |
| `GOOGLE_API_KEY` | If using Google | Gemini API key |
| `ALPHA_VANTAGE_API_KEY` | No | Alpha Vantage key (free tier: 25 req/day) |
| `COINGECKO_API_KEY` | No | CoinGecko Pro key (free tier works without) |
| `EVAL_PROVIDER` | No | Override provider for eval judge (anthropic \| openai \| google) |
| `EVAL_MODEL` | No | Override model name for eval judge |
| `EVAL_API_KEY` | No | Override API key for eval judge |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI / Agents | Vercel AI SDK — Anthropic Claude, OpenAI GPT, Google Gemini |
| Technical Analysis | `technicalindicators` (EMA, MACD, ADX, RSI, BB, ATR, OBV, VWAP, CMF) |
| Market Data | `yahoo-finance2`, CoinGecko API, Alpha Vantage API |
| Schema Validation | Zod |
| Web Dashboard | Next.js 15, React 19, Tailwind CSS 4 |
| Charting | `lightweight-charts` v5 |
| UI Components | Radix UI primitives |
| Toast Notifications | Sileo |
| Real-time Updates | WebSocket (`ws`) |
| Testing / Evals | Vitest |
| Runtime | Node.js >= 24 |

## Disclaimer

This software is for **educational and research purposes only**. It does not constitute financial advice. Trading involves substantial risk of loss. Past performance does not guarantee future results. Always do your own research and consult a qualified financial advisor before making investment decisions.

## License

[MIT](LICENSE)
