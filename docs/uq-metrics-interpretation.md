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
| Confounders | the experimental design (space-filling grids co-vary inputs) + measurement scatter attenuated/blurred | surrogate error + whatever the declared distributions encode |
| Where it belongs | data-quality / campaign diagnostics | the UQ story, next to the UQ histogram |

**Pearson/Spearman exist in both modes.** Sobol' indices **only exist in model mode**:
they decompose `Var[f(X)]` and require a probability measure on the inputs. "Sobol on
the raw data" can only mean *using the campaign's empirical distribution as the measure*
— legitimate math, but then the answer is "what moved the response in **this**
experiment", not "what drives the model". Changing your sampling campaign changes that
number without changing any physics.

## 2. A toy where the two modes disagree violently

Model truth: `y = 2·x1 + 0.1·x3` — **x1 is the driver**, x3 is nearly irrelevant.

Your campaign swept `x1 ∈ [1.0, 1.1]` (narrow) and `x3 ∈ [0, 100]` (wide):

- Spread in `y` from x1: `2 · 0.029 ≈ 0.06`
- Spread in `y` from x3: `0.1 · 28.9 ≈ 2.9`

→ **Data-mode** bars attribute ≈ 100 % to **x3**. True about the campaign.

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
  `corr(observed, predicted)` and/or CV RMSE as the histogram's neighbor: the
  one data-derived number that legitimately licenses every model-mode number
  above it. Compatible with B.

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

*Provenance: written after the GH-Copilot audit of #661–#665; the numbers in §2
are exact for a uniform grid sweep (σ = width/√12).*
