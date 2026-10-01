# Sensitivity & correlation: which population are we measuring?

**Status: DISCUSSION DOC — not normative.** The binding contract lives in `SPEC.md`
(root / `flaskapi/` / `node/`). This note exists because a real ambiguity in our UQ UI
was accidentally *shipped* once (§B B36, flaskapi) and resurfaced as a design question:

> Correlation / Sobol can be computed on the completed-job data **or** on the
> MC samples propagated through the surrogate. Those answer different questions.
> Do we want both — and if so, where?

## 1. The two objects, precisely

| | **Data-mode** (descriptive) | **Model-mode** (uncertainty analysis) |
|---|---|---|
| Population | the completed jobs (the campaign) | draws from *your declared* input distributions |
| Target | the **observed** job outputs | the **surrogate's** predictions, one per draw |
| Question answered | "In the data I collected, what co-moved?" | "Under my stated uncertainty, what drives the model's response?" |
| Confounders | the experimental design (its ranges + pairing fix which co-movements are even visible; designs that correlate inputs make it worse) + measurement scatter attenuated/blurred | surrogate error + whatever the declared distributions encode |
| Where it belongs | data-quality / campaign diagnostics | the UQ story, next to the UQ histogram |

**Pearson/Spearman exist in both modes.** Sobol' indices are defined **only with respect
to a probability measure on the inputs** (they decompose `Var[f(X)]`); the measure *this UI*
uses is the *declared* (expert) one ⇒ model mode. "Sobol' on raw data" does exist as math —
take the campaign's empirical distribution as the measure — but it answers
"what moved the response in **this** experiment", i.e. *campaign history*, not
sensitivity: change the sampling campaign and the number changes without any physics
changing. An empirical measure is a legitimate Sobol measure either way: when the design
factorizes (a product measure — e.g. §2's full-factorial grid), the classical
independent-input decomposition applies directly and the answer is simply *campaign
history*; when the design correlates inputs (many space-filling designs induce some
pairwise dependence), what you get is an extended (Sobol-GS-style) decomposition, not
the familiar S1 — so always check the design before trusting "empirical Sobol".

## 2. A toy where the two modes disagree violently

Model: `y = 2·x1 + 0.1·x3`. Even "x1 is the driver" is measure-relative — it is true
under the expert's declaration in step 2 below and **false** under the campaign's own
measure. That is what this example demonstrates, not what it assumes.

Campaign: a full-factorial sweep of a `101 × 101` grid over `x1 ∈ [1.0, 1.1]`,
`x3 ∈ [0, 100]` (every combination ⇒ grid `Cov(x1, x3) = 0`; grid population SDs
`σ(x1) = 0.1/101·√((101²−1)/12) ≈ 0.0289`, `σ(x3) ≈ 28.87` — the marginal ranges alone
do NOT determine these statistics; the pairing is part of the example):

- Contribution to `y`-spread: x1 → `2·0.0289 ≈ 0.058`; x3 → `0.1·28.87 ≈ 2.9`

→ **Data-mode** bars attribute ≈ 100 % to **x3** (for this additive model on this
orthogonal design, data-mode Pearson and empirical-measure variance attribution
separate term-by-term). True about the campaign.

An expert then declares `x1 ~ N(1, 0.3)`, `x3 ~ N(50, 1)`:

- Variance share of `f(x1,x3)` from x1: `(2·0.3)² = 0.36`; from x3: `(0.1·1)² = 0.01`

→ **Model-mode** Sobol gives **S1(x1) ≈ 0.97**. True about the model + stated beliefs.

Same surrogate, same UI, opposite headline bars. Neither is "wrong" — they answer
different questions, and **one of them is silently misleading if labeled as the other**.

## 3. Where the codebase stands (post #661–#666, Oct 2026)

- The UQ histogram, **correlation indices**, and **Sobol indices** are all
  **model-mode**, and correlation + histogram share the *same* MC sample set
  (flaskapi V39 restored in #665). The panels tell one coherent story.
- The bounds editor (#664/#665) is how the user *declares the measure* for Sobol
  (boxes / pins / auto-inferred observed support).
- **Data-mode metrics exist nowhere in the UI.** #661 shipped correlation as
  data-mode *by accident*, labeled model-mode, and every test stayed green —
  the `distributions/numSamples/seed` fields were validated then ignored
  (flaskapi §B B36). That is the cautionary artifact for this discussion:
  the mislabeled mode does not announce itself.
- Closest existing data-derived metric: SuMo **CV RMSE** (generalization of the
  fit to the data) in the validation panel.

## 4. Options for surfacing data-mode views (for discussion)

- **A. Keep UQ panels model-mode only** (status quo). Nothing misleads; the
  campaign-confounding diagnostic is simply unavailable.
- **B. Separate, name-loaded view** — e.g. a *"Data Summary (completed jobs)"*
  tab: data-mode Pearson/Spearman, input pairwise scatter/correlation matrix.
  Genuinely useful *for expert users checking design confounding*; honest
  because the frame says "data", not "uncertainty".
- **C. Adjacent to the UQ histogram with labels** — **not recommended**: visual
  adjacency *is* the meaning; labels are a thin defense in a dense dashboard,
  and B36 is the existence proof that mode confusion survives review.
- **D. Promote the *trust* metric next to the histogram** —
  `corr(observed, predicted)` and/or CV RMSE as the histogram's neighbor: *bounded*
  validation evidence, not a license — in-sample `corr(observed, predicted)` stays near
  1 for an overfit surrogate, and CV RMSE certifies only the campaign's support; neither
  covers a declared UQ measure that extrapolates beyond it. Still the most useful
  data-derived number to surface (frame it as "evidence", ⊥ "licenses everything
  above"). Compatible with B.

**Recommendation to react to:** keep the UQ panels as-is (A), discuss B+D as one
increment ("understand my data / trust my model" side by side, both clearly
non-UQ-branded), reject C on the record.

## 5. Open questions for the team

1. Who is the audience for campaign-confounding diagnostics — the same users as
   the UQ panel, or the person who designed the DoE?
2. Is "variance attribution over collected data" (empirical-measure Sobol) ever
   worth exposing, *if* named as campaign history rather than sensitivity?
3. Naming: is "Correlation Indices" clear enough now that it means
   model-mode-by-MC, or should the UI say "…under your UQ settings"?
4. Should the correlation request honor per-variable log-scales exactly like the
   Sobol/histogram calls do (FE currently sends distributions + seed; scales
   ride on other panels' payloads)?

*Provenance: written after the GH-Copilot audit of #661–#665. §2's spreads use the
population SD of a finite endpoint-inclusive `n`-point grid,
`(b−a)/n·√((n²−1)/12)` — `width/√12` is only its `n→∞` limit (at n=101 the
difference is < 0.01 %). The ≈ 100 %/≈ 0.97 attributions are exact for the stated
full-factorial design.*
