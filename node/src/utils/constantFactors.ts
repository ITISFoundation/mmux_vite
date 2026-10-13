// Constant-factor boundary (§V13): `constant` is the frontend's OWN preset/UI
// state (an all-identical imported column or a manually pinned variable). The
// backend distribution schema (DistributionParams, flaskapi dakota_models.py)
// understands only normal|uniform, so a constant must never go on the wire as a
// shape — every surrogate request validated against that schema (UQ
// propagation, correlation, MOGA) rejects it 422 (GH-Copilot #714, B50ef).
// The end-to-end representation is "remove the factor": a constant contributes
// zero variance, so it leaves the surrogate's dimensionality — the same reading
// the flaskapi domains/`fixed` contract takes for Sobol' (a pinned factor
// leaves the sweep) and the one PlotTools' constant-axis filters already apply.
//
// Both sides are filtered independently: every map entry is schema-validated
// even for variables absent from `inputVars`, so a stray constant entry must
// leave the map too, not just the variable list.
export function withoutConstantFactors(
  inputVars: string[],
  distributions: InputVarSelection | undefined,
): { inputVars: string[]; distributions: InputVarSelection | undefined } {
  // Freshly restored persistence can lack distribution entries; pass through
  // verbatim rather than inventing state (mirrors the PlotTools guard).
  if (!distributions) {
    return { inputVars, distributions };
  }
  const keptVars = inputVars.filter(varName => distributions[varName]?.distribution !== "constant");
  const keptDistributions = Object.fromEntries(
    Object.entries(distributions).filter(([_varName, selection]) => selection?.distribution !== "constant"),
  );
  return { inputVars: keptVars, distributions: keptDistributions };
}
