import { describe, expect, it } from "vitest";
import { withoutConstantFactors } from "./constantFactors";

// B50ef (GH-Copilot #714): `constant` is FE preset/UI state; DistributionParams
// accepts only normal|uniform, so UQ/correlation/MOGA payloads must ship the
// factor set WITHOUT constants (remove the factor — zero variance leaves the
// surrogate dimensionality).
describe("withoutConstantFactors (surrogate payload boundary)", () => {
  const selections: InputVarSelection = {
    x1: { distribution: "constant", value: 2, scale: "linear" },
    x2: { distribution: "uniform", min: 1, max: 100, scale: "log" },
    x3: { distribution: "normal", mean: 5, std: 1, scale: "linear" },
  };

  it("drops constant variables from BOTH the variable list and the map", () => {
    const result = withoutConstantFactors(["x1", "x2", "x3"], selections);
    expect(result.inputVars).toEqual(["x2", "x3"]);
    expect(Object.keys(result.distributions as InputVarSelection)).toEqual(["x2", "x3"]);
  });

  it("passes non-constant selections through verbatim (shape AND scale ride on)", () => {
    const result = withoutConstantFactors(["x1", "x2", "x3"], selections);
    expect((result.distributions as InputVarSelection).x2).toEqual(selections.x2);
    expect((result.distributions as InputVarSelection).x3).toEqual(selections.x3);
  });

  it("a constant map entry absent from inputVars still leaves the map (every entry is schema-validated)", () => {
    const result = withoutConstantFactors(["x2"], {
      ...selections,
      ghost: { distribution: "constant", value: 7, scale: "linear" },
    });
    expect(result.inputVars).toEqual(["x2"]);
    expect(Object.keys(result.distributions as InputVarSelection)).toEqual(["x2", "x3"]);
  });

  it("no constants → identity (nothing is dropped, ⊥ new map semantics)", () => {
    const result = withoutConstantFactors(["x2", "x3"], { x2: selections.x2, x3: selections.x3 });
    expect(result.inputVars).toEqual(["x2", "x3"]);
    expect(result.distributions).toEqual({ x2: selections.x2, x3: selections.x3 });
  });

  it("missing distribution entries pass through (restored-persistence guard, ⊥ invented state)", () => {
    const result = withoutConstantFactors(["x1", "x2"], undefined);
    expect(result.inputVars).toEqual(["x1", "x2"]);
    expect(result.distributions).toBeUndefined();
  });

  it("all-constant factors collapse to an empty set (backend then reports honestly, ⊥ silent 422 shape)", () => {
    const result = withoutConstantFactors(["x1"], { x1: selections.x1 });
    expect(result.inputVars).toEqual([]);
    expect(result.distributions).toEqual({});
  });
});
