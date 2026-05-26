# Forex ML/LLM Trading Bot — Build Plan (refined)

> Status: design document, no code yet. Target repo: standalone (to be created).
> Conventions: timestamps UTC unless noted; "pip" means the conventional 4th-decimal
> unit for non-JPY pairs and 2nd-decimal for JPY pairs.

---

## 1. Context and objectives

Build a reproducible research and paper-trading platform for spot FX that
combines technical, macro, positioning, and news-derived signals, generates
trade candidates with auditable rationale, and backtests honestly before
any live deployment.

The headline target is approximately **10% per annum** with tight drawdown
control and low leverage. The number is a sanity anchor, not an
optimisation target — the system optimises for Sharpe, robustness across
walk-forward windows, and reproducibility. A backtest that returns 40%
with a fragile feature pipeline is a failure; a backtest that returns 9%
across multiple regimes with an audited rationale per trade is a success.

The **v1 success criteria** the system must meet end-to-end:

1. Load and normalise historical data for at least 4 major pairs over ≥5 years.
2. Build aligned feature sets across technical, macro, positioning, and sentiment inputs with point-in-time correctness.
3. Run walk-forward backtests with realistic spread/slippage and report confidence intervals on Sharpe.
4. Emit a machine-readable rationale per trade candidate (LLM or deterministic fallback).
5. Paper trade continuously for ≥4 weeks without operational failure or unreconciled orders.
6. Enforce hard risk limits independently of any model output.

The first milestone is **not** profitable live trades. It is a research loop
that other people (or future-you) can audit.

**Architectural principle**: the LLM is a reasoning and narrative layer,
not the alpha engine. The predictive core is a gradient-boosted tree or
logistic model on engineered features. The LLM extracts structured
information from text and writes human-readable rationale. It never
places, sizes, or vetoes a trade.

---

## 2. Scope and constraints

### In scope (v1)

- Spot FX majors: **EUR/USD, GBP/USD, USD/JPY, AUD/USD**. Optional later: USD/CAD, NZD/USD, EUR/GBP.
- Multi-timeframe:
  - M1 / tick — execution simulation only
  - M30 / H1 — entry feature generation
  - H4 / D1 — regime and trend context
  - Weekly — positioning and macro alignment
- Free data sources only (Dukascopy, FRED, CFTC, Forex Factory, GDELT/NewsAPI).
- Python 3.12 monolith, Dockerised, local-first deployment.

### Out of scope (v1)

- HFT or sub-second latency
- Reinforcement learning in live trading
- Self-modifying production logic
- Multi-broker smart order routing
- Leverage > 10× notional, martingale, averaging-down

### Australian regulatory context (operator is AU-based)

The following are flags requiring confirmation before live trading. Not legal or tax advice.

- **ASIC retail leverage caps** (in force since Mar 2021): 30:1 for majors, 20:1 for minors, 10:1 for commodities. This affects position sizing math — at 0.5% risk per trade and 30:1 cap, available notional is bounded; strategy viability at conservative risk levels must be re-checked, not assumed.
- **Broker eligibility**: OANDA Australia, IC Markets, Pepperstone are ASIC-regulated and provide API access. Confirm OANDA AU v20 API parity with OANDA global before committing to it as the execution adapter — endpoint behaviour and instrument lists differ.
- **Tax classification**: trading frequency, intent, and scale determine whether profits are CGT or business income under ATO rules. Flag for an accountant before live; affects record-keeping requirements (the audit log this system produces will help either way).
- **Personal-use data licensing**: free historical and macro data (Dukascopy, HistData, FRED, CFTC) generally permit personal/research use; redistribution and commercial use have separate terms. Confirm per source before any code is published or shared.

### Solo-developer constraint

One person, part-time. Realistic effort estimate to reach end-of-Phase-6 (paper trading running):
**4–6 months part-time**. Phase estimates are in §16.

---

## 3. Architecture overview

```text
                 ┌─────────────────┐
                 │ Data collectors │
                 └────────┬────────┘
                          │
                  raw parquet snapshots
                          │
                 ┌────────▼────────┐
                 │  Normalization  │
                 └────────┬────────┘
                          │
                 normalized parquet
                          │
                 ┌────────▼────────┐         ┌────────────────┐
                 │ Feature store   │◄────────┤ Label generator│
                 └────────┬────────┘         └────────────────┘
                          │
              ┌───────────┼────────────┐
              │           │            │
       ┌──────▼─────┐ ┌───▼────┐ ┌─────▼──────┐
       │ Backtester │ │ Models │ │ LLM extract│
       └──────┬─────┘ └───┬────┘ └─────┬──────┘
              │           │            │
              └─────┬─────┴─────┬──────┘
                    │           │
              ┌─────▼──────┐ ┌──▼──────────┐
              │  Strategy  │ │ LLM rationale│
              │  engine    │ └──┬──────────┘
              └─────┬──────┘    │
                    │           │
                    └─────┬─────┘
                          │
                  ┌───────▼──────┐
                  │ Risk engine  │
                  └───────┬──────┘
                          │
                  ┌───────▼──────┐
                  │ Execution    │ (paper → live)
                  └───────┬──────┘
                          │
                  ┌───────▼──────┐
                  │ Monitoring   │
                  └──────────────┘
```

**Component contracts** (what each receives and emits — full schemas in §5):

| Component       | Input                                  | Output                                  |
|-----------------|----------------------------------------|------------------------------------------|
| Collectors      | source URLs/APIs                       | `raw/<source>/<symbol>/<date>.parquet`   |
| Normaliser      | raw parquet                            | `normalized/<entity>/<symbol>/<date>.parquet` |
| Feature store   | normalised tables                      | `features/<run_id>/<symbol>/<tf>.parquet` |
| Label generator | normalised candles                     | `labels/<run_id>/<symbol>/<tf>.parquet`  |
| Models          | features + labels                      | `models/<run_id>/{model.pkl, meta.json}` |
| Strategy engine | predictions                            | `trade_candidate` rows                    |
| LLM rationale   | trade_candidate + context window       | `trade_rationale` rows (schema-validated)|
| Risk engine     | trade_candidate + rationale + portfolio| `risk_decision` rows                      |
| Execution       | approved trade_candidate               | `order` + `fill` rows                     |

Every artifact carries a `run_id` (content hash of inputs + code version) so any
output is reconstructable from raw data.

---

## 4. Data layer

### 4.1 Sources

| Source                         | Use                          | Cadence    | Licence (verify)          | Known gotchas |
|--------------------------------|------------------------------|------------|---------------------------|---------------|
| Dukascopy historical           | tick + M1 for backtest       | daily      | personal use OK; verify   | weekend gaps; broker-specific Sun open time; no Sat data |
| HistData.com                   | M1 backup, gap fill          | monthly    | personal use; no redist   | quality varies by year |
| Broker feed (OANDA AU)         | live + paper execution       | streaming  | broker T&Cs               | candle close ≠ tick last-trade for spot FX |
| FRED API                       | US macro series              | irregular  | free, attribution         | release timestamps not always exact; use ALFRED for revision history |
| Central bank sites             | statements, minutes, speeches| event      | public                    | PDFs; OCR sometimes needed; URL schemes change |
| Forex Factory calendar         | event timestamps + consensus | continuous | no public API; ToS-grey   | scraping is fragile; consider Investing.com or Econoday as alternates |
| CFTC COT (legacy + TFF)        | weekly positioning           | weekly (Fri)| public                   | reports Tue snapshot, released Fri — 3-day lag; futures ≠ spot positioning |
| CME QuikStrike COT view        | sanity-check positioning     | manual     | free                      | for inspection, not ingestion |
| GDELT v2                       | global news/events           | 15-min     | free, attribution         | high noise; needs filtering |
| NewsAPI free tier              | headlines                    | continuous | very low rate limit       | use as discovery only, not ingestion |

### 4.2 Storage layout

```text
data/
  raw/             # immutable source snapshots, never modified
    dukascopy/<symbol>/<yyyy>/<mm>/<dd>.parquet
    fred/<series_id>/<ingest_date>.parquet
    cftc/<report>/<release_date>.parquet
    forex_factory/<ingest_date>.parquet
  normalized/      # canonical schema, deduplicated
    candle/<symbol>/<timeframe>/<yyyy-mm>.parquet
    macro_series_point/<series_id>.parquet
    economic_release_outcome/<release_date>.parquet
    cot_report/<report_date>.parquet
  features/<run_id>/<symbol>/<timeframe>.parquet
  labels/<run_id>/<symbol>/<timeframe>.parquet
  models/<run_id>/
  reports/<run_id>/
```

- **Parquet** with `pyarrow`. Partition keys on the directory tree, not as columns, to keep file sizes bounded.
- **DuckDB** for ad-hoc analytics over parquet (zero-copy via `read_parquet`).
- **Postgres** for metadata only: `model_run`, `prediction`, `trade_candidate`, `risk_decision`, `order`, `fill`, `position`, `backtest_run`. Never bulk time series.

### 4.3 Point-in-time correctness

The single most important rule: **`as_of_time` ≤ feature-vector timestamp**.

Every entity carries two timestamps:

- `as_of_time` — when the information became known to the market (e.g., release time of a CPI print).
- `ingested_at` — when our system received it (may be later by minutes to days).

Macro releases get revised. The point-in-time rule says: when building a
feature at time T, only use data where `as_of_time ≤ T` **and** values
that were known at T (i.e., the **vintage** that existed at T, not the
latest revision). FRED supports this via ALFRED archival series.
COT reports are dated to the Tuesday snapshot but released Friday — use
the Friday release time as `as_of_time`, not the Tuesday snapshot date.

Implementation: every join in feature engineering is a
`pandas.merge_asof(... direction="backward")` keyed on `as_of_time`, never
a left-join on date.

### 4.4 Known data risks (call out, do not paper over)

- **Forex Factory has no public API.** The scraper will break. Build it
  behind an abstract `EventCalendarSource` interface so it can be swapped
  for Investing.com or a paid feed without touching downstream code.
- **COT is futures positioning, not spot FX positioning.** Treat it as a
  noisy proxy for speculative sentiment, not as a directional signal on
  its own. The 3-day reporting lag means it is useful only as a slow-moving
  regime feature.
- **Dukascopy weekend boundaries** vary by their internal session
  definition; align to a single canonical session (NY 17:00 close) at
  the normaliser, not downstream.
- **Broker candles ≠ tick aggregations.** OANDA's M1 candle close price
  is the mid of the last tick in the bucket, not the close of the
  preceding tick. Backtest using Dukascopy tick aggregation; switch to
  broker candles only for live and accept the small mismatch
  (document it).
- **Survivorship is real even in FX.** Pairs are demoted (CHF post-2015,
  TRY periodically); document the universe construction rule so the
  backtest universe at time T includes only pairs tradable at T.

---

## 5. Core schemas

Defined with `pydantic.BaseModel`. Six load-bearing entities below in full;
the remaining 14 are listed by name in §5.7 with a one-line purpose only.

### 5.1 `Candle`

```python
class Candle(BaseModel):
    symbol: str                  # canonical: "EUR_USD"
    timeframe: Literal["tick", "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"]
    as_of_time: datetime         # UTC, bar close
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int | None           # tick volume for FX; nullable
    bid_close: Decimal | None
    ask_close: Decimal | None
    source: str                  # "dukascopy" | "oanda" | "histdata"
    ingested_at: datetime
    content_hash: str            # sha256 of (symbol|tf|as_of_time|ohlc) for idempotency
```

### 5.2 `EconomicReleaseOutcome`

```python
class EconomicReleaseOutcome(BaseModel):
    event_id: str                # stable across vintages: "US_CPI_YOY_2026-04"
    country: str                 # ISO 3166-1 alpha-2
    indicator: str               # "CPI_YOY"
    as_of_time: datetime         # release time, UTC
    actual: Decimal | None
    forecast: Decimal | None
    previous: Decimal | None
    revised_previous: Decimal | None
    impact: Literal["low", "medium", "high"]
    vintage: int                 # 0 = first print, 1 = first revision, ...
    source: str
    ingested_at: datetime
```

### 5.3 `CotReport`

```python
class CotReport(BaseModel):
    report_date: date            # Tuesday snapshot
    release_time: datetime       # Friday 20:30 UTC release
    as_of_time: datetime         # = release_time (point-in-time correct)
    instrument: str              # "EUR_FX"
    noncomm_long: int
    noncomm_short: int
    noncomm_spread: int
    comm_long: int
    comm_short: int
    open_interest: int
    source: str = "cftc"
    ingested_at: datetime
```

### 5.4 `FeatureRow`

```python
class FeatureRow(BaseModel):
    symbol: str
    timeframe: str
    as_of_time: datetime         # feature is valid for decisions at >= this time
    feature_set_version: str     # semver of the feature definitions
    values: dict[str, float]     # flat name -> value; NaN-free at emit time
    content_hash: str
```

`values` is intentionally a flat dict, not a typed model, to keep feature
addition cheap. A separate `feature_schema_v{n}.json` file pins the
expected keys and dtypes per version; CI rejects drift.

### 5.5 `TradeCandidate`

```python
class TradeCandidate(BaseModel):
    candidate_id: str            # uuid
    symbol: str
    as_of_time: datetime
    direction: Literal["long", "short"]
    entry_type: Literal["market", "limit"]
    entry_price_hint: Decimal | None
    stop_loss: Decimal           # absolute price, mandatory
    take_profit: Decimal | None
    max_holding_period: timedelta
    model_run_id: str
    model_score: float
    model_confidence: float      # calibrated probability in [0, 1]
    feature_snapshot_id: str     # pointer to FeatureRow content_hash
    regime_tag: str | None       # "trend_low_vol" etc.
```

### 5.6 `TradeRationale`

```python
class TradeRationale(BaseModel):
    candidate_id: str            # FK to TradeCandidate
    prompt_version: str          # "v3"
    llm_model: str               # provider model id (e.g., "claude-haiku-4-5")
    generated_at: datetime
    direction: Literal["long", "short"]
    technical_reasons: list[str]
    fundamental_reasons: list[str]
    positioning_reasons: list[str]
    risks: list[str]
    invalidators: list[str]      # conditions that would void the thesis
    confidence_text: Literal["low", "moderate", "high"]
    confidence_numeric: float    # advisory; risk engine ignores this
    holding_period_hint: str
    source_excerpt_ids: list[str]# pointers to news/statements used
    fallback_used: bool          # True if deterministic template fired
```

### 5.7 Other entities (named only)

- `Tick` — raw bid/ask with timestamp, used only by execution simulator.
- `MacroSeriesPoint` — single (series_id, as_of_time, value, vintage) row.
- `EconomicEvent` — calendar entry (event_id, scheduled_time, impact) prior to release.
- `NewsArticle` — (url, title, body, published_at, source).
- `CentralBankDocument` — (institution, doc_type, published_at, full_text, url).
- `LabelRow` — (symbol, timeframe, as_of_time, label_def_id, label_value).
- `ModelRun` — (run_id, code_version, feature_set_version, training_window, hyperparams).
- `Prediction` — (model_run_id, feature_snapshot_id, score, calibrated_proba).
- `RiskDecision` — (candidate_id, decision: approve/reject/resize, reasons, sized_units).
- `Order` — (broker_order_id, candidate_id, state, price, units, submitted_at).
- `Fill` — (order_id, price, units, time, commission).
- `Position` — (symbol, units, avg_price, opened_at, candidate_id).
- `BacktestRun` — (run_id, config_hash, period, metrics).
- `BacktestTrade` — per-trade record from a backtest run.
- `PerformanceSnapshot` — daily aggregate of live/paper performance.

---

## 6. Feature engineering

Categories below. Implementation file map: `features/{technical,macro,cot,sentiment,labels}.py`.

### 6.1 Technical features

- Log returns over lookbacks {1, 5, 10, 20, 60} bars
- ATR(14), ATR(50) — for volatility-targeted sizing
- RSI(14), RSI(50)
- MACD(12, 26, 9): signal line, histogram, divergence flag
- ADX(14) + DI+/DI−
- Bollinger Band distance: `(close − ma20) / (2 × sigma20)`
- Realised volatility: rolling 20-bar std of log returns, annualised
- Z-scores of returns over {20, 60, 120} bars
- Session tags: Asia (00–08 UTC), London (07–16), NY (12–21), with overlap flags
- Distance to N-period high/low in ATR units, N ∈ {20, 50, 200}
- Trend slope: OLS slope of log price over last 50 bars on H1/H4/D1
- Cross-pair correlations: rolling 60-bar correlation of returns vs DXY proxy

**Point-in-time rule**: every feature emits with `as_of_time = bar_close`,
and is only usable for decisions at strictly later timestamps. Indicators
that look forward by construction (e.g., centered moving averages) are
banned.

### 6.2 Regime and structure features

- Trend/range classifier: ADX > 25 → trend, ADX < 20 → range, else mixed
- Volatility regime: realised vol percentile over 252-day rolling window, bucketed low/mid/high
- Carry proxy: 2-year short-rate differential between the two currencies in the pair (from FRED)
- Yield-spread proxy: 10y − 2y for each currency, plus the differential
- Risk-on/risk-off proxy: rolling correlation of pair to SPX returns (positive ⇒ risk-on currency on long leg)

### 6.3 Macro / event features

- `minutes_to_next_high_impact_event` (per affected currency)
- `minutes_since_last_high_impact_event`
- **Surprise score**: `(actual − forecast) / rolling_std(actual − forecast, 24m)`; clipped to ±5
- Revision score: `(revised_previous − previous) / rolling_std(...)`
- Policy-rate differential per pair (from central-bank target rates)
- Last-3-moves direction per currency (encoded as integer in {−3..+3})
- Inflation gap: `cpi_yoy − target_cpi`

### 6.4 Positioning features

- Net non-commercial position: `noncomm_long − noncomm_short`
- 26-week and 52-week percentile of net position
- Δ net position week-over-week
- Positioning-vs-trend divergence: sign(Δ position) vs sign(trend slope) — flag when disagreeing

### 6.5 Sentiment / LLM-derived features

- Headline sentiment score (rolling 24h mean) — from a small classifier, not the LLM, to keep cost bounded
- Hawkish/dovish tone score per central bank (LLM-extracted, weekly cadence)
- Event-urgency score (LLM-extracted from breaking news)
- Topic tags as multi-hot: {inflation, growth, labour, liquidity, geopolitical}

### 6.6 Feature-leakage tests (mandatory CI gate)

For each feature, an automated test asserts:

1. **Time monotonicity**: shuffling the future of the underlying series does not change the feature value at any past timestamp.
2. **No-future bar use**: recomputing the feature using only data with `as_of_time < t` gives the same value as the production feature at `t`.
3. **Schema parity live vs backtest**: feature distributions on a fixed slice of historical data produced by the live pipeline match the backtest pipeline within tolerance (KS test p > 0.01).

Test #1 catches windowing bugs. Test #2 catches macro-revision bleed.
Test #3 catches feature-pipeline drift between research and production.

---

## 7. Labels and prediction targets

Build several labellings and compare; do not commit to one early.

### 7.1 Directional label

`y = 1{forward_return_over_H_bars > cost}`, with `cost = spread + slippage_estimate`.
Asymmetric: only positive labels for moves that clear cost.

### 7.2 Triple-barrier label (preferred for entry models)

For each candidate entry at time `t`:

- Upper barrier: `entry + k_up · ATR(t)`
- Lower barrier: `entry − k_down · ATR(t)`
- Vertical barrier: `t + max_holding_period`

Label = +1 if upper hit first, −1 if lower hit first, 0 if vertical hit first.
Typical `k_up = k_down = 2.0`, `max_holding_period = 24h` on H1 setups.

**Worked example** (EUR/USD H1, ATR(14) = 0.00080):
- entry = 1.08500, k_up = k_down = 2.0, horizon = 24h
- upper = 1.08500 + 2 × 0.00080 = 1.08660
- lower = 1.08500 − 2 × 0.00080 = 1.08340
- scan next 24 H1 bars; whichever barrier is touched first determines the label.

The TP/SL distances used in labelling **must** match the TP/SL used by the
strategy at execution; otherwise the model learns a different problem
than it is asked to solve.

### 7.3 Expected-return regression

`y = forward_return_over_H_bars − cost`. Continuous target; allows P&L-weighted training.

### 7.4 Meta-label (likely v1 path)

Generate naive base setups (e.g., RSI extremes, trend pullbacks). Train a
classifier to predict, given the base setup is firing, whether to **take**
or **skip** the trade. This sidesteps the harder unconditional prediction
problem and concentrates the model on a tractable accept/reject decision.

---

## 8. Models

### 8.1 Baselines (build before anything else)

- Logistic regression (with L1/L2 sweep)
- XGBoost classifier
- LightGBM classifier

(Random forest is dropped from the original list — redundant with gradient boosting and slower.)

### 8.2 Non-model baselines (must be beaten)

- Random signal: trade flipped-coin direction, same sizing rules
- Trend-following: take a position in the direction of the H4 slope, exit on flip
- Mean-reversion: fade RSI extremes
- Macro-event blackout: identical to one of the above, but flat ±2h around high-impact events
- Buy-and-hold per pair

### 8.3 Calibration (mandatory before any model is used)

Classifier scores are not probabilities until proven so. For every model:

- Reliability diagram on the validation fold
- Brier score reported alongside accuracy/AUC
- If miscalibrated, fit isotonic or Platt scaling on the validation fold and apply at predict time

The risk engine consumes `model_confidence` as a probability. If
calibration tests fail, the model is rejected regardless of headline
metrics.

### 8.4 Advanced models (only after baselines are solid)

- Small temporal CNN / LSTM / transformer
- Regime-specific experts gated by the §6.2 classifier
- Stacked ensembles (linear blend of calibrated probabilities)

### 8.5 What not to do early

- RL for direct live execution
- Deep nets on weak/unaudited features
- Online learning in production

---

## 9. LLM layer

### 9.1 Roles (only two)

1. **Structured extraction** from central-bank statements, minutes, speeches, and headlines.
2. **Trade rationale generation** for candidates already approved by the quant stack.

The LLM never modifies a trade, vetoes a trade, or sizes a trade.

### 9.2 Model selection

- **Extraction**: cheap, fast model (Claude Haiku tier). High volume, low complexity, batch-friendly.
- **Rationale**: stronger reasoning model (Claude Sonnet tier). Low volume (one per candidate, ~few per day at v1 trade frequency), benefits from richer context handling.

Pin exact model IDs in config and record them on every output row. The
`TradeRationale.llm_model` field captures this for audit.

### 9.3 Cost budget

Estimate before Phase 5:

- Extraction: ~20 central-bank documents/week + ~200 filtered headlines/day ≈ N tokens/month. Bound monthly cost; hard-cap at configured ceiling.
- Rationale: ~3–10 candidates/day × ~2k tokens/candidate × Sonnet pricing.

Implement a **monthly token-budget counter** in `llm/client.py`. When 90%
of budget is consumed, switch to deterministic fallback for rationale
(template-filled from feature values). When 100% consumed, halt new LLM
calls and alert.

### 9.4 Prompt versioning

- Prompts live in `llm/prompts/v{N}/{task}.md`.
- Every LLM call records the prompt version on the output row.
- Bumping a prompt is a code change with a PR; old versions are retained.
- A regression test pipes a fixed set of inputs through the current prompt and snapshots the structured output; meaningful schema changes are flagged.

### 9.5 JSON schemas (four total)

The four structured outputs:

1. `macro_sentiment_assessment` — per-region rolling sentiment summary.
2. `central_bank_tone_assessment` — hawkish/dovish score + evidence spans for one document.
3. `news_event_summary` — single event normalised to (event_type, severity, affected_currencies, summary).
4. `trade_rationale` — schema in §5.6.

Every call goes through a validator. On schema violation:

- Retry once with explicit schema reminder in the prompt.
- On second failure, emit a deterministic fallback record with `fallback_used = True` and the raw LLM text stored in an `audit_blob` field for later inspection.
- Increment a counter; alert if fallback rate exceeds 5% over a rolling window.

### 9.6 Source attribution

Every LLM output carries `source_excerpt_ids` pointing to the news article
or central-bank document rows it was based on. Excerpts are cached
verbatim so the rationale is reconstructable even if the source URL rots.

---

## 10. Backtest engine

Event-driven, not vectorised. Vectorised backtests are fast but encourage
look-ahead — every signal becomes a row that "knows" the bar close it sits
in. An event-driven loop forces strict causality.

### 10.1 Core loop (pseudocode)

```python
def run_backtest(config: BacktestConfig) -> BacktestRun:
    events: PriorityQueue[Event] = build_event_stream(config)
    portfolio = Portfolio(starting_equity=config.equity)
    risk = RiskEngine(config.risk)
    strategy = Strategy(config.strategy)
    fills: list[Fill] = []

    while not events.empty():
        ev = events.pop()           # popped in (timestamp, priority) order

        if ev.kind == "bar_close":
            features = feature_store.snapshot(ev.symbol, ev.tf, ev.time)
            candidates = strategy.on_bar(features, portfolio.state_at(ev.time))
            for c in candidates:
                decision = risk.evaluate(c, portfolio.state_at(ev.time))
                if decision.approved:
                    events.push(OrderEvent(c, time=ev.time + LATENCY))

        elif ev.kind == "order":
            fill = simulate_fill(ev.candidate, market_at=ev.time)  # spread, slippage
            if fill is not None:
                portfolio.apply(fill)
                fills.append(fill)

        elif ev.kind == "stop_check":
            for pos in portfolio.open_positions(ev.time):
                hit = check_stops(pos, bar_at=ev.time)
                if hit:
                    events.push(OrderEvent(close(pos), time=ev.time))

        elif ev.kind == "session_close":
            portfolio.mark_to_market(ev.time)

    return BacktestRun(fills=fills, portfolio=portfolio, config=config)
```

Key properties:

- All decisions at time `t` see only data with `as_of_time ≤ t`.
- Order events have a deterministic `LATENCY` (config; default 200ms).
- Stops are checked on every bar of the holding-period horizon, not just at decision points.
- Equity curve is reconstructable from the `fills` list alone.

### 10.2 Spread model

Piecewise constants by `(symbol, session)`, calibrated from Dukascopy bid/ask:

```text
spread(symbol, t) = base_spread[symbol, session(t)] × stress_multiplier(t)
stress_multiplier(t) = 1 + α · 1{|minutes_to_high_impact_event(t)| < 30}
```

`α` defaults to 2.0 (i.e., spreads double in the 30-min window around
high-impact releases). Empirical α per pair can be fitted from data
later; the constant is a reasonable v1 floor.

### 10.3 Slippage model

```text
slippage(order, t) = β · realised_vol_5m(t) · sqrt(order_units / typical_units)
```

`β` defaults to 0.5 (half a standard deviation of 5-minute returns per
unit-normalised order). This intentionally errs pessimistic.

### 10.4 Walk-forward protocol

Default windows:

- Train: 24 months
- Validate: 6 months (model selection, calibration fit)
- Test: 3 months (locked, reported as out-of-sample)
- Roll: 3 months

Variants for robustness: {18/4/3, 36/6/6}.

**Purged + embargoed splits** are required when using triple-barrier
labels — labels overlap in time, so naive train/test splits leak. Purge
training rows whose label horizon extends into the test set; embargo a
small buffer (≈ horizon length) after the test set before resuming
training.

### 10.5 Sample-size honesty

Five years of data with 3-month rolls yields ~20 walk-forward windows.
That is not enough to pin a Sharpe ratio to one decimal place. Report:

- Median Sharpe across windows
- 25th/75th percentile band
- Worst-window Sharpe
- Fraction of windows with positive Sharpe

A strategy with median Sharpe 0.8 but worst-window −1.5 is not
production-ready; one with median 0.6 and worst-window 0.1 is more
interesting.

### 10.6 Metrics reported per backtest

- CAGR, annualised vol, Sharpe, Sortino, Calmar
- Max drawdown, drawdown duration
- Win rate, profit factor, avg win / avg loss
- Exposure, turnover, time in market
- Per-pair, per-regime, per-signal-family breakdowns
- Bootstrapped confidence intervals on Sharpe (≥1000 resamples)

---

## 11. Risk management

The system wins or loses on discipline, not leverage.

### 11.1 Portfolio rules (hard-coded; not model-overridable)

- Max risk per trade: **0.25–0.50% of equity** (config; default 0.25%)
- Max total open risk across positions: **2.0%**
- Max daily realised loss: **1.0%** → halt new entries for the day
- Weekly drawdown pause: **2.5–3.0%** → halt for 5 trading days, require manual resume
- Correlated-exposure cap: aggregate USD-side notional ≤ 1.5× single-pair max
- Mandatory hard stop-loss on every order at submission time
- No averaging down, no martingale, no scaling in on losers

### 11.2 Position sizing math

```text
risk_amount      = risk_per_trade × current_equity
stop_distance    = abs(entry_price − stop_loss_price)        # in price units
pip_value_per_unit = pip_size / quote_rate                    # for non-account quote
units            = risk_amount / (stop_distance × pip_value_per_unit)
```

Then cap by ASIC leverage limit:

```text
max_notional   = current_equity × leverage_cap   # 30 for majors
units          = min(units, max_notional / entry_price)
```

Then cap by Kelly fraction:

```text
edge           = model_confidence × avg_win − (1 − model_confidence) × avg_loss
kelly_fraction = max(0, edge / avg_win²)
units          = min(units, 0.25 × kelly_fraction × max_notional / entry_price)
```

The 0.25 multiplier ("quarter-Kelly") is standard practice to absorb
parameter-estimation error in `model_confidence`. Never run full Kelly
on a model trained on noisy financial data.

### 11.3 Validation order

Every candidate passes through these checks in order; first failure rejects:

1. Schema valid?
2. Stop-loss present and on correct side of entry?
3. Stop distance ≥ minimum (config; e.g., 5 pips on EUR/USD)?
4. Within session window (no entries 5 min before close)?
5. Spread ≤ threshold for symbol?
6. No high-impact event within blackout window (unless strategy is event-driven)?
7. Position-size math yields units ≥ broker minimum?
8. Total open risk after this trade ≤ 2.0%?
9. Correlated-exposure cap satisfied?
10. Daily-loss limit not breached?
11. Weekly-drawdown pause not active?

A `RiskDecision` row is written for every candidate, approved or
rejected, with the list of failed checks. This is the primary audit
trail for "why didn't the bot take that obvious trade".

---

## 12. Paper trading

Mandatory 4–8 weeks before any live capital.

### 12.1 What paper trading must verify

- Signal generation is stable across restarts (deterministic given inputs)
- Order creation, modification, cancellation paths are exercised
- Time synchronisation: candle close → feature emit → decision → order, all sub-second from bar close
- Risk engine rejections behave as designed
- Dashboard and alert wiring works end-to-end
- **Backtest vs paper parity**: features and decisions on the same historical slice match between the backtest engine and the paper-trading process

### 12.2 Reconciliation protocol (daily, automated)

Each session close:

1. Pull broker's order and position state for the account.
2. Diff against internal state.
3. Any mismatch → alert + write `reconciliation_break` row.
4. Two consecutive days of unresolved breaks → halt new entries; manual review.

Reconciliation is the single highest-value pre-live test. Most live-trading
disasters originate as state mismatches that no one notices for hours.

### 12.3 Daily paper report

Auto-generated at NY close, emailed/Slacked:

- P&L (realised, unrealised, total)
- Trades opened/closed today with rationale ID links
- Risk-engine rejections with reasons
- Feature drift indicators (PSI vs training distribution)
- LLM fallback rate, schema-violation rate, monthly token spend YTD
- Any reconciliation breaks

---

## 13. Live-readiness gate

Before any live capital, all of:

- ≥4 weeks continuous paper trading with no unreconciled breaks
- ≥3 consecutive walk-forward windows with median-window Sharpe > 0.5 and worst-window Sharpe > −0.5
- Calibration error (Brier or ECE) within accepted band
- Kill switch tested end-to-end (see §13.1)
- Runbook for incident response written and reviewed
- Manual-approval mode enabled for first 2 weeks of live trading
- Secrets handling reviewed (no broker tokens in logs, env, or repo)

### 13.1 Kill switch (concrete spec)

Three triggers, any one fires the switch:

1. **Daily-loss breach**: realised P&L ≤ −1.0% of equity → flat all positions at market, halt new entries until manual resume.
2. **Broker disconnect**: heartbeat to broker fails for >60s → halt new entries; if disconnect persists >5min, attempt flat-all via fallback REST endpoint, then alert.
3. **Manual flag file**: presence of `KILL_SWITCH` file in a configured path → flat all positions immediately, halt indefinitely.

Switch state persists across restarts (file-backed). Manual resume
requires a separate command (not just deleting the flag file) to prevent
accidental restart.

---

## 14. Observability

Three telemetry classes, with concrete dashboard panels per class.

### 14.1 Operational telemetry

Panels: pipeline run-time histogram per stage; API error rate per source; missing-data event count; LLM call latency and error rate; broker reconciliation break count; container restart count.

### 14.2 Model telemetry

Panels: feature drift (PSI per feature, traffic-light by threshold); prediction-score distribution vs training; calibration drift (reliability diagram weekly); live-vs-backtest feature parity test results; per-pair, per-regime model-confidence distribution.

### 14.3 Trading telemetry

Panels: equity curve; drawdown (current + worst); rolling 20-trade hit rate; slippage realised vs expected; spread at entry distribution; exposure over time; turnover; P&L attribution by signal family and by regime.

Stack: Plotly for static reports, Grafana fed by Postgres + DuckDB-over-parquet for dashboards.

---

## 15. Testing strategy

### 15.1 Unit tests

- Indicator math (RSI, MACD, ATR, ADX, Bollinger) against TA-Lib reference values — **golden-file regression**
- Feature generation idempotency
- Label generation: triple-barrier corner cases (no barrier hit, both barriers hit on same bar, vertical exactly at horizon)
- Risk sizing math: per-trade risk, leverage cap, Kelly cap
- Schema validation: every entity round-trips through pydantic
- LLM output parsing: schema-valid, schema-invalid retry, fallback path

### 15.2 Integration tests

- Full ingestion pipeline on a 1-week fixture
- End-to-end backtest on a fixed 1-month slice, snapshot equity curve
- Paper order lifecycle: place → partial fill → cancel → reconcile
- Broker disconnect → kill switch fires → flat-all completes

### 15.3 Regression tests

- Snapshot tests on the feature vector for a fixed (symbol, timestamp)
- Frozen backtest fixtures: benchmark Sharpe and max DD must not regress beyond tolerance
- Prompt-output schema-compatibility tests

### 15.4 Special tests

- DST transitions (Mar/Nov NY, Mar/Oct London, Apr/Oct Sydney)
- Sunday open / Friday close session boundaries
- Forex-Factory rescheduled-event handling (event moves date)
- Duplicate-ingestion idempotency (re-running a collector produces no new rows)
- Macro-revision handling: vintage-N data does not contaminate features computed before vintage-N existed

---

## 16. Build phases with realistic effort

Assumes solo, part-time (~10–15 hr/week).

### Phase 0 — Scaffold (~1 week)

Repo skeleton, pyproject, config system, logging, Docker, `make {test,lint,run}`.
**Acceptance**: tests pass on empty suite; configs load per env; structured logs visible.

### Phase 1 — Historical ingestion (~2–3 weeks)

Dukascopy downloader, HistData importer, FRED ingestor, CFTC ingestor, news-ingestor placeholder, normalised parquet layout, data-quality checks.
**Acceptance**: 5 years of 4 majors loaded; macro and COT aligned; gap/duplicate/tz checks pass.

### Phase 2 — Feature store (~3–4 weeks)

Technical + macro + positioning + sentiment placeholders + label generation, leakage tests, point-in-time joins.
**Acceptance**: features reproducible from raw; schema versioned; all leakage tests pass.

### Phase 3 — Backtest engine (~3 weeks)

Event-driven engine, spread/slippage models, walk-forward harness, baseline strategies + report.
**Acceptance**: backtests end-to-end; reports generated per run_id; results reproducible bit-for-bit.

### Phase 4 — ML models (~3–4 weeks)

Logistic/XGB/LGBM pipeline, model registry, calibration, feature importance.
**Acceptance**: at least one baseline beaten OOS on at least one segment; calibration passes.

### Phase 5 — LLM rationale (~2 weeks)

Prompt templates v1, JSON schemas, central-bank tone extraction, rationale generation, fallback path.
**Acceptance**: every candidate gets a rationale or audit-logged fallback; prompt version recorded.

### Phase 6 — Paper trading (~4–6 weeks of clock time)

Broker paper adapter, scheduler, order state machine, daily report, reconciliation, alerting.
**Acceptance**: 4 continuous weeks with no unreconciled breaks; no risk-rule violations.

### Phase 7 — Live-readiness (~2 weeks)

Deployment hardening, secrets, runbooks, kill-switch tests, manual-approval mode.
**Acceptance**: every item in §13 checked off; first-live phase requires per-trade manual approval.

**Total clock time to end-of-Phase-6**: ~18–25 weeks part-time. Faster is possible
by cutting LLM scope (Phase 5 → deterministic templates only) and skipping sentiment
features in v1.

---

## Appendix A — Open questions and known risks

Track each as an issue in the eventual repo.

### A1 — Regulatory (resolve before Phase 6 paper goes live)

- ASIC retail leverage caps: confirm OANDA AU enforces 30:1 on majors via API rejection or silent cap; document behaviour.
- OANDA AU v20 vs global API: identify instrument-list and endpoint differences; pin a single supported endpoint set.
- Conditions under which API access requires a wholesale-client classification.

### A2 — Data licensing (resolve before Phase 1 code is published anywhere)

- Dukascopy: confirm personal-research use terms; check whether derived parquet redistribution is allowed.
- HistData: T&Cs around storage and redistribution.
- Forex Factory: scraping ToS posture; explore Investing.com or Econoday as alternates.
- FRED, CFTC: confirm attribution requirements.

### A3 — LLM cost (resolve before Phase 5)

- Estimate token usage per trade candidate and per central-bank document.
- Pin monthly budget ceiling in config.
- Decide fallback policy: deterministic template vs cheaper model when budget is hit.

### A4 — Modelling robustness (resolve before Phase 4 exit)

- Out-of-regime test: hold out 2020 H1 (COVID) and 2022 H2 (rate cycle) as never-trained slices; performance there is a stronger signal than aggregate OOS.
- Decide whether to retrain quarterly, annually, or on regime-shift detection.

### A5 — Universe and survivorship (resolve before Phase 3 reports are quoted)

- Document universe-construction rule (which pairs were tradable at time T) and apply it to historical backtests, not the current universe.
- Note that majors-only results do not transfer to crosses.

### A6 — Operational fragility (ongoing)

- Solo dev = single point of failure. Document key procedures (key rotation, kill switch operation, restart) so a non-author could execute them.
- Schedule a quarterly self-review against this plan; treat divergences as either bugs to fix or as plan amendments (with PR).

### A7 — Tax (flag, not advice)

- AU CGT vs business-income classification depends on frequency, intent, scale.
- Audit log produced by the system satisfies record-keeping needs either way; format may need adjustment depending on classification.

---

## Appendix B — Notes on this revision

This document is a refinement of the original build plan. Substantive changes:

- The standalone "Concrete implementation prompt for Claude Code" section from the original was removed; its content is subsumed by §2, §3, and §16.
- "Recommended strategy philosophy" was folded into §1 (architectural principle: LLM as reasoning layer) and §8 (model roadmap).
- Risk, testing, and observability are now contiguous (§11, §14, §15) rather than scattered.
- New material with no equivalent in the original:
  - §2 Australian regulatory context
  - §4.3 point-in-time correctness rules
  - §4.4 named data risks
  - §5 concrete pydantic schemas for the 6 load-bearing entities
  - §6.6 leakage-test specification
  - §7.2 worked triple-barrier example with numbers
  - §8.3 calibration as a gate
  - §9.3 LLM cost budget mechanism
  - §9.4 prompt versioning protocol
  - §10.1 backtest-loop pseudocode
  - §10.2/10.3 explicit spread and slippage formulae
  - §10.4 purged + embargoed cross-validation
  - §10.5 sample-size honesty
  - §11.2 position-sizing math
  - §11.3 ordered validation list
  - §12.2 reconciliation protocol
  - §13.1 kill-switch spec
  - §14 dashboard panels per telemetry class
  - §15.1 golden-file indicator tests
  - §16 phase time estimates
  - Appendix A with 7 named open questions
