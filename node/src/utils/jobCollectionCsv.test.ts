import { describe, it, expect, vi } from "vitest";
import { parseJobCollectionCsv, pickDistributionPreset, describeShapeFit, pickSingleCsvFile } from "./jobCollectionCsv";

describe("jobCollectionCsv", () => {
  describe("parseJobCollectionCsv", () => {
    it("parses metadata preamble + inputs/outputs table", () => {
      const csv = [
        "# source_function_uid,func-123",
        "# source_job_collection_uid,jc-456",
        "# source_job_collection_title,My Campaign",
        "source_job_uid,status,input__x1,input__x2,output__y",
        "job-1,SUCCESS,1.0,10.0,100.0",
        "job-2,SUCCESS,2.0,20.0,200.0",
      ].join("\n");

      const result = parseJobCollectionCsv(csv);

      expect(result.sourceFunctionUid).toBe("func-123");
      expect(result.sourceJobCollectionUid).toBe("jc-456");
      expect(result.sourceJobCollectionTitle).toBe("My Campaign");
      expect(result.inputVars).toEqual(["x1", "x2"]);
      expect(result.outputVars).toEqual(["y"]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        sourceJobUid: "job-1",
        status: "SUCCESS",
        inputs: { x1: 1.0, x2: 10.0 },
        outputs: { y: 100.0 },
      });
    });

    it("infers uniform distribution min/max presets per input variable", () => {
      const csv = [
        "source_job_uid,status,input__x1,output__y",
        "job-1,SUCCESS,1.0,10.0",
        "job-2,SUCCESS,5.0,20.0",
        "job-3,SUCCESS,3.0,30.0",
      ].join("\n");

      const result = parseJobCollectionCsv(csv);

      expect(result.inputPresets.x1).toEqual({
        distribution: "uniform",
        min: 1.0,
        max: 5.0,
        scale: "linear",
      });
    });

    it("infers log-scale when values span >=2 orders of magnitude", () => {
      const csv = [
        "source_job_uid,status,input__x1,output__y",
        "job-1,SUCCESS,0.001,10.0",
        "job-2,SUCCESS,10,20.0",
        "job-3,SUCCESS,100,30.0",
      ].join("\n");

      const result = parseJobCollectionCsv(csv);

      expect(result.inputPresets.x1.scale).toBe("log");
    });

    it("does not infer log-scale when values are non-positive or narrow-range", () => {
      const csv = [
        "source_job_uid,status,input__x1,input__x2,output__y",
        "job-1,SUCCESS,-1.0,1.0,10.0",
        "job-2,SUCCESS,2.0,1.5,20.0",
      ].join("\n");

      const result = parseJobCollectionCsv(csv);

      expect(result.inputPresets.x1.scale).toBe("linear");
      expect(result.inputPresets.x2.scale).toBe("linear");
    });

    it("handles quoted CSV cells containing commas", () => {
      const csv = ["source_job_uid,status,input__x1,output__y", 'job-1,SUCCESS,"1,000",10.0'].join("\n");

      const result = parseJobCollectionCsv(csv);

      // quoted "1,000" is not a valid number so it is dropped from bounds inference
      expect(result.rows[0].inputs.x1).toBeUndefined();
      expect(result.inputPresets.x1).toBeUndefined();
    });

    it("B19/V27: treats blank/whitespace-only input+output cells as missing, not 0", () => {
      const csv = [
        "source_job_uid,status,input__x1,input__x2,output__y",
        "job-1,SUCCESS,,   ,",
        "job-2,SUCCESS,2.0,20.0,200.0",
      ].join("\n");

      const result = parseJobCollectionCsv(csv);

      expect(result.rows[0].inputs).toEqual({});
      expect(result.rows[0].outputs).toEqual({});
      // bounds inference must also ignore the missing cell rather than folding in a 0:
      // the single surviving value 2.0 becomes a constant preset (min===max branch),
      // not a degenerate [2,2] uniform around a phantom 0.
      expect(result.inputPresets.x1).toEqual({
        distribution: "constant",
        value: 2.0,
        scale: "linear",
      });
    });

    it("B20/V28: parses a quoted preamble value containing a comma", () => {
      const csv = [
        '# source_job_collection_title,"My, Campaign"',
        "source_job_uid,status,input__x1,output__y",
        "job-1,SUCCESS,1.0,10.0",
      ].join("\n");

      const result = parseJobCollectionCsv(csv);

      expect(result.sourceJobCollectionTitle).toBe("My, Campaign");
    });

    it("returns empty result for a header-only / empty CSV", () => {
      expect(parseJobCollectionCsv("")).toEqual({
        sourceFunctionUid: undefined,
        sourceJobCollectionUid: undefined,
        sourceJobCollectionTitle: undefined,
        inputVars: [],
        outputVars: [],
        inputPresets: {},
        rows: [],
      });
    });

    it("parses Windows CRLF line endings", () => {
      const csv = "# source_function_uid,fn-9\r\ninput__x,output__y\r\n1,2\r\n5,6\r\n";
      const result = parseJobCollectionCsv(csv);

      expect(result.sourceFunctionUid).toBe("fn-9");
      expect(result.rows.map(row => row.outputs.y)).toEqual([2, 6]);
      expect(result.inputPresets.x).toMatchObject({ min: 1, max: 5 });
    });

    it.each([
      ["non-numeric text", "abc"],
      ["NaN literal", "NaN"],
      ["Infinity literal", "Infinity"],
      ["missing trailing cell", undefined],
    ])("treats a %s cell as missing instead of a number", (_label, cell) => {
      const row = cell === undefined ? "1" : `1,${cell}`;
      const result = parseJobCollectionCsv(`input__x,output__y\n${row}\n2,3\n`);

      expect(result.rows[0]).toEqual({ sourceJobUid: undefined, status: undefined, inputs: { x: 1 }, outputs: {} });
      expect(result.rows[1].outputs).toEqual({ y: 3 });
    });

    it("drops an input column whose values are all unusable from the presets", () => {
      const result = parseJobCollectionCsv("input__x,input__z,output__y\n1,n/a,2\n2,,3\n");

      expect(result.inputVars).toEqual(["x", "z"]);
      expect(Object.keys(result.inputPresets)).toEqual(["x"]);
    });

    it("does not throw on an unterminated quote and keeps earlier cells", () => {
      const result = parseJobCollectionCsv('input__x,input__label,output__y\n1,"broken,2\n');

      expect(result.rows[0].inputs).toEqual({ x: 1 });
      expect(result.rows[0].outputs).toEqual({});
    });
  });

  describe("pickDistributionPreset (best-fit shape x scale inference)", () => {
    // Binomial(n=6, p=0.5)-shaped counts around integer positions -3..3: symmetric,
    // skewness=0 and excess kurtosis near 0 (well above the uniform reference of
    // -1.2), so it reliably reads as "normal". 64 samples clears the 10-sample bar.
    const normalLikePositions = [-3, -2, -1, 0, 1, 2, 3];
    const normalLikeCounts = [1, 6, 15, 20, 15, 6, 1];
    const normalLikeValues = normalLikePositions.flatMap((position, index) => Array(normalLikeCounts[index]).fill(position));

    it("selects constant for a single repeated value", () => {
      expect(pickDistributionPreset(Array(20).fill(5))).toEqual({ distribution: "constant", value: 5, scale: "linear" });
    });

    it("selects normal for symmetric bell-shaped data", () => {
      const preset = pickDistributionPreset(normalLikeValues);
      expect(preset.distribution).toBe("normal");
      if (preset.distribution === "normal") {
        expect(preset.mean).toBeCloseTo(0, 5);
        expect(preset.std).toBeGreaterThan(0);
      }
    });

    it("selects log-normal (normal shape + log scale) for exponentiated bell-shaped data, rounded to 3 significant digits", () => {
      const preset = pickDistributionPreset(normalLikeValues.map(position => Math.exp(position)));
      expect(preset.distribution).toBe("normal");
      expect(preset.scale).toBe("log");
      if (preset.distribution === "normal") {
        // linear-space moments (the narrowed union reads normal+log as log-normal)
        expect(preset.mean).toBeGreaterThan(0);
        expect(preset.std).toBeGreaterThan(0);
        expect(preset.mean).toBe(Number(preset.mean.toPrecision(3)));
        expect(preset.std).toBe(Number(preset.std.toPrecision(3)));
      }
    });

    it('B51gh (GH-Copilot #714): a narrow-span bell (<1 decade) never infers scale:"log" — log-NORMAL is gated like log-uniform', () => {
      // Copilot's counterexample verbatim: the same bell fixture exponentiated
      // by position/10 spans ~0.26 decades. The log-normal shape-fit still
      // wins on shape distance, but V13 gates ANY log candidate on the
      // ≥1-decade span — a log axis here would be visually indistinguishable
      // from linear, so the linear reading must win.
      const narrowBell = normalLikeValues.map(position => Math.exp(position / 10));
      const preset = pickDistributionPreset(narrowBell);
      expect(preset.scale).toBe("linear");
      expect(preset.distribution).toBe("normal");
    });

    it("the wide exponentiated bell clears the decade gate and STILL infers log (gate ⊥ over-reach)", () => {
      // e^-3..e^3 ≈ 2.6 decades: genuinely log-scale data keeps its verdict.
      const preset = pickDistributionPreset(normalLikeValues.map(position => Math.exp(position)));
      expect(preset.scale).toBe("log");
    });

    it("B48ab: detects log-uniform (not plain uniform) for real log-LHS-sampled data at N=50", () => {
      // Real user-reported log-LHS columns. The pre-replay heuristic (legacy §B30) collapsed
      // (skewness, excess-kurtosis) into a non-negative magnitude, losing kurtosis's
      // sign, so these heavy-tailed positive-kurtosis-in-raw-space columns
      // spuriously read as "close to uniform" and never got scale:"log" despite
      // spanning >=1.4 orders of magnitude and being near-flat once log-transformed.
      const perineurium = [
        0.000547204, 0.000799577, 0.00631465, 0.000526783, 0.00390982, 0.000569349, 0.000710955, 0.000686411, 0.000631487,
        0.0105723, 0.00216104, 0.00059859, 0.0111528, 0.000826683, 0.000421595, 0.00112671, 0.00785452, 0.000756862, 0.0102709,
        0.00862013, 0.000650095, 0.00723341, 0.00838606, 0.00194551, 0.000440655, 0.00262716, 0.00247093, 0.00119617, 0.0044606,
        0.00101557, 0.0068734, 0.000406686, 0.0119378, 0.0074002, 0.00337727, 0.00206101, 0.00104688, 0.0023369, 0.00107412,
        0.0047632, 0.00425683, 0.00171801, 0.00402968, 0.00163322, 0.00319968, 0.00505012, 0.00142211, 0.000383343, 0.00133148,
        0.00122125,
      ];
      const epineurium = [
        0.0341126, 0.0366736, 0.100222, 0.027858, 0.0537574, 0.0844183, 0.196205, 0.0294578, 0.0161293, 0.0180663, 0.046733,
        0.0437431, 0.0882327, 0.0685889, 0.210313, 0.0201239, 0.0146881, 0.0656029, 0.0788496, 0.315542, 0.0194375, 0.0509329,
        0.024936, 0.253591, 0.0311323, 0.0403035, 0.0189107, 0.355446, 0.0639302, 0.184034, 0.0485824, 0.105608, 0.0621643,
        0.223523, 0.169883, 0.0503984, 0.353382, 0.412064, 0.0221112, 0.405141, 0.16226, 0.110112, 0.369585, 0.0763268, 0.0821386,
        0.434687, 0.0169136, 0.0268612, 0.0179227, 0.0238509,
      ];

      [perineurium, epineurium].forEach(values => {
        const preset = pickDistributionPreset(values);
        expect(preset.distribution).toBe("uniform");
        if (preset.distribution === "uniform") {
          expect(preset.scale).toBe("log");
        }
      });
    });

    it("B48ab: does not spuriously flag a narrow-range (<1 decade) variable as log-scale even when raw-space kurtosis is large and positive", () => {
      // Same user CSV, a column spanning <1 decade (0.46-0.96): a log axis wouldn't
      // meaningfully differ from a linear one, so scale stays "linear" regardless of
      // what a noisy skewness/kurtosis shape-fit says at N=50.
      const bloodSigma = [
        0.75131, 0.79399, 0.490335, 0.47301, 0.915867, 0.724899, 0.686434, 0.703126, 0.825238, 0.933432, 0.637843, 0.791281,
        0.514158, 0.564657, 0.549407, 0.802335, 0.473728, 0.561337, 0.890955, 0.536966, 0.83158, 0.553725, 0.865674, 0.48544,
        0.508699, 0.654994, 0.673807, 0.928775, 0.658729, 0.465125, 0.459668, 0.506026, 0.694636, 0.610325, 0.56998, 0.769325,
        0.756029, 0.871226, 0.648096, 0.943075, 0.496853, 0.533563, 0.584227, 0.862295, 0.743232, 0.955024, 0.628249, 0.586077,
        0.853509, 0.763633,
      ];

      const preset = pickDistributionPreset(bloodSigma);
      expect(preset.distribution).toBe("uniform");
      if (preset.distribution === "uniform") {
        expect(preset.scale).toBe("linear");
      }
    });

    it("B48ab: falls back to uniform below the sample bar when the data doesn't span >=2 orders of magnitude", () => {
      expect(pickDistributionPreset([1, 3, 5, 7, 9])).toEqual({ distribution: "uniform", min: 1, max: 9, scale: "linear" });
    });

    it("B48ab: prefers log-uniform over plain uniform for positive data spanning >=2 orders of magnitude even with too few samples for a shape-fit", () => {
      const preset = pickDistributionPreset([1, 10, 100, 1000, 10000]);
      expect(preset.distribution).toBe("uniform");
      if (preset.distribution === "uniform") {
        expect(preset.scale).toBe("log");
        expect(preset.min).toBe(1);
        expect(preset.max).toBe(10000);
      }
    });

    it("B48ab: rounds inferred uniform min/max to 3 significant digits, outward so bounds still cover the data", () => {
      // stratified/evenly-spread values (like a uniform LHS design) over a narrow
      // (<2 orders of magnitude) range, N=10: reliably picks uniform via the
      // shape-fit path, exercising the min/max rounding rather than log branches.
      const n = 10;
      const values = Array.from({ length: n }, (_, i) => 1.23456789 + ((i + 0.5) / n) * (45.6789 - 1.23456789));
      const preset = pickDistributionPreset(values);
      const actualMin = Math.min(...values);
      const actualMax = Math.max(...values);
      expect(preset.distribution).toBe("uniform");
      if (preset.distribution === "uniform") {
        expect(preset.min).toBe(3.45); // floor(actualMin, 3 sig figs) <= actualMin
        expect(preset.max).toBe(43.5); // ceil(actualMax, 3 sig figs) >= actualMax
        expect(preset.min).toBeLessThanOrEqual(actualMin);
        expect(preset.max).toBeGreaterThanOrEqual(actualMax);
      }
    });

    it("B48ab: exported high-precision values are rounded to 3 significant digits without excluding the data", () => {
      const boneCancellous = [0.006066, 0.00828, 0.011315, 0.017044, 0.024212, 0.03712, 0.053109, 0.089766, 0.145988, 0.19478];
      const preset = pickDistributionPreset(boneCancellous);
      expect(preset.distribution).toBe("uniform");
      if (preset.distribution === "uniform") {
        expect(preset.min).toBeLessThanOrEqual(0.006066);
        expect(preset.max).toBeGreaterThanOrEqual(0.19478);
        expect(preset.min).toBe(Number(preset.min.toPrecision(3)));
        expect(preset.max).toBe(Number(preset.max.toPrecision(3)));
      }
    });
  });

  describe("describeShapeFit (visible rationale under the scale toggle)", () => {
    it("returns undefined when there is no data", () => {
      expect(describeShapeFit([])).toBeUndefined();
    });

    it("reports constant for identical values", () => {
      expect(describeShapeFit([5, 5, 5])).toBe("constant · every value identical");
    });

    it("is honest about the low-sample fallback", () => {
      expect(describeShapeFit([1, 2, 3])).toContain("below the shape-fit bar");
    });

    it("names the winning candidate and both distances once the sample bar is cleared", () => {
      const values = Array.from({ length: 10 }, (_, i) => 10 ** i); // evenly log-spaced: log-uniform
      expect(describeShapeFit(values)).toMatch(/^best fit log-uniform · shape-distance \d\.\d\d vs uniform \d\.\d\d$/);
    });

    it("B51gh (GH-Copilot #714): mirrors the gate — a narrow bell's rationale is plain normal, never log-normal", () => {
      const positions = [-3, -2, -1, 0, 1, 2, 3];
      const counts = [1, 6, 15, 20, 15, 6, 1];
      const bell = positions.flatMap((position, index) => Array(counts[index]).fill(position));
      const narrowBell = bell.map(position => Math.exp(position / 10)); // ~0.26 decades
      expect(describeShapeFit(narrowBell)).toMatch(/^best fit normal ·/);
      // and the genuinely wide column keeps naming log-normal
      expect(describeShapeFit(bell.map(position => Math.exp(position)))).toMatch(/^best fit log-normal ·/);
    });
  });

  describe("pickSingleCsvFile", () => {
    it("rejects when the file picker is dismissed without a selection", async () => {
      const createElementSpy = vi.spyOn(document, "createElement");

      const resultPromise = pickSingleCsvFile();
      const input = createElementSpy.mock.results[0].value as HTMLInputElement;
      input.dispatchEvent(new Event("change"));

      await expect(resultPromise).rejects.toThrow("No file selected");
      createElementSpy.mockRestore();
    });

    it("B22/V30: rejects when the picker is dismissed without ever firing change (native cancel)", async () => {
      vi.useFakeTimers();
      const createElementSpy = vi.spyOn(document, "createElement");

      const resultPromise = pickSingleCsvFile();
      const assertion = expect(resultPromise).rejects.toThrow("No file selected");
      // Simulate a native cancel: the window regains focus but `change` never fires
      // because `input.files` stays empty.
      window.dispatchEvent(new Event("focus"));
      await vi.runAllTimersAsync();

      await assertion;
      createElementSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});
