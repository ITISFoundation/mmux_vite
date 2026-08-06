import { describe, it, expect, vi } from "vitest";
import {
  analyzeUploadedJobCollectionCsv,
  computeDistributionParamsForType,
  parseJobCollectionCsv,
  pickSingleCsvFile,
} from "./jobCollectionCsv";

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

      expect(result.inputPresets.x1).toEqual({ distribution: "uniform", min: 1.0, max: 5.0, scale: "linear" });
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
      // bounds inference must also ignore the missing cell rather than folding in a 0
      expect(result.inputPresets.x1).toEqual({ distribution: "uniform", min: 2.0, max: 2.0, scale: "linear" });
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

function buildCsv(variable: string, values: number[]): string {
  const header = `schema_version,source_job_uid,status,input__${variable},output__score`;
  const rows = values.map((value, index) => `1,job-${index},SUCCESS,${value},${index}`);
  return [header, ...rows].join("\n");
}

// Binomial(n=6, p=0.5)-shaped counts around integer positions -3..3: symmetric,
// with skewness=0 and excess kurtosis close to 0 (well below the uniform reference
// of -1.2), so it reliably reads as "normal" rather than "uniform" under the
// shapeScore heuristic. 64 samples clears the hasEnoughSamples threshold (10).
const normalLikePositions = [-3, -2, -1, 0, 1, 2, 3];
const normalLikeCounts = [1, 6, 15, 20, 15, 6, 1];
const normalLikeValues = normalLikePositions.flatMap((position, index) => Array(normalLikeCounts[index]).fill(position));

describe("analyzeUploadedJobCollectionCsv", () => {
  it("derives min/max presets and enables log scale for log-distributed positive inputs", () => {
    const csvContent = [
      "# source_function_uid,func-1",
      "schema_version,source_job_uid,status,input__radius,output__score",
      "1,job-1,SUCCESS,1,10",
      "1,job-2,SUCCESS,10,11",
      "1,job-3,SUCCESS,100,12",
      "1,job-4,SUCCESS,1000,13",
      "1,job-5,SUCCESS,10000,14",
      "1,job-6,SUCCESS,100000,15",
      "1,job-7,SUCCESS,1000000,16",
      "1,job-8,SUCCESS,10000000,17",
      "1,job-9,SUCCESS,100000000,18",
      "1,job-10,SUCCESS,1000000000,19",
    ].join("\n");

    const analysis = analyzeUploadedJobCollectionCsv(csvContent);

    expect(analysis.inputVars).toEqual(["radius"]);
    expect(analysis.outputVars).toEqual(["score"]);
    expect(analysis.inputPresets.radius).toEqual({
      distribution: "uniform",
      min: 1,
      max: 1000000000,
      scale: "log",
    });
  });

  it("preserves real exported min/max values without relying on metadata labels", () => {
    const csvContent = [
      "source_job_uid,status,input__bone_cancellous,output__score",
      "seed42_sample02,SUCCESS,0.006066,10",
      "seed42_sample03,SUCCESS,0.00828,11",
      "seed42_sample04,SUCCESS,0.011315,12",
      "seed42_sample05,SUCCESS,0.017044,13",
      "seed42_sample06,SUCCESS,0.024212,14",
      "seed42_sample07,SUCCESS,0.03712,15",
      "seed42_sample08,SUCCESS,0.053109,16",
      "seed42_sample09,SUCCESS,0.089766,17",
      "seed42_sample10,SUCCESS,0.145988,18",
      "seed42_sample11,SUCCESS,0.19478,19",
    ].join("\n");

    const analysis = analyzeUploadedJobCollectionCsv(csvContent);

    expect(analysis.inputPresets.bone_cancellous?.min).toBe(0.006066);
    expect(analysis.inputPresets.bone_cancellous?.max).toBe(0.19478);
  });

  it("disables log scale when uploaded values include negatives", () => {
    const csvContent = [
      "schema_version,source_job_uid,status,input__x,output__score",
      "1,job-1,SUCCESS,-10,1",
      "1,job-2,SUCCESS,-1,2",
      "1,job-3,SUCCESS,1,3",
      "1,job-4,SUCCESS,10,4",
    ].join("\n");

    const analysis = analyzeUploadedJobCollectionCsv(csvContent);

    expect(analysis.inputPresets.x).toEqual({
      distribution: "uniform",
      min: -10,
      max: 10,
      scale: "linear",
    });
  });

  it("without inferDistributionType, always defaults to uniform even for normal/log-normal-shaped data", () => {
    const analysis = analyzeUploadedJobCollectionCsv(buildCsv("x", normalLikeValues));

    expect(analysis.inputPresets.x?.distribution).toBe("uniform");
  });

  it("with inferDistributionType, selects constant for a single repeated value", () => {
    const csvContent = buildCsv("x", Array(20).fill(5));

    const analysis = analyzeUploadedJobCollectionCsv(csvContent, { inferDistributionType: true });

    expect(analysis.inputPresets.x).toEqual({ distribution: "constant", value: 5 });
  });

  it("with inferDistributionType, selects normal for symmetric bell-shaped data", () => {
    const analysis = analyzeUploadedJobCollectionCsv(buildCsv("x", normalLikeValues), {
      inferDistributionType: true,
    });

    const preset = analysis.inputPresets.x;
    expect(preset?.distribution).toBe("normal");
    if (preset?.distribution === "normal") {
      expect(preset.mean).toBeCloseTo(0, 5);
      expect(preset.std).toBeGreaterThan(0);
    }
  });

  it("with inferDistributionType, selects log-normal (normal shape + log scale) for exponentiated bell-shaped data and rounds to 3 significant digits", () => {
    const values = normalLikeValues.map(position => Math.exp(position));
    const analysis = analyzeUploadedJobCollectionCsv(buildCsv("x", values), { inferDistributionType: true });

    const preset = analysis.inputPresets.x;
    expect(preset?.distribution).toBe("normal");
    expect(preset?.scale).toBe("log");
    if (preset?.distribution === "normal") {
      expect(preset.mean).toBeGreaterThan(0);
      expect(preset.std).toBeGreaterThan(0);
      // rounded to 3 significant digits
      expect(preset.mean).toBe(Number(preset.mean.toPrecision(3)));
      expect(preset.std).toBe(Number(preset.std.toPrecision(3)));
    }
  });

  it("B30/V36: with inferDistributionType, correctly detects log-uniform (not plain uniform) for real log-LHS-sampled data at N=50", () => {
    // Real columns from a user-reported log-LHS-sampled CSV (N=50 each). Before B30,
    // `pickDistributionPreset`'s `uniformDistance = |shapeScore - 1.2|` collapsed
    // (skewness, excess kurtosis) into a single non-negative magnitude before comparing
    // it to the uniform reference, losing kurtosis's sign — so these heavy-tailed,
    // positive-kurtosis-in-raw-space columns spuriously read as "close to uniform" and
    // NEVER got logScale=true, even though they span >=1.4 orders of magnitude and are
    // close to flat/uniform once log-transformed.
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
      const analysis = analyzeUploadedJobCollectionCsv(buildCsv("x", values), { inferDistributionType: true });
      const preset = analysis.inputPresets.x;
      expect(preset?.distribution).toBe("uniform");
      if (preset?.distribution === "uniform") {
        expect(preset.scale).toBe("log");
      }
    });
  });

  it("B30/V36: does not spuriously flag a narrow-range (<1 decade) variable as log-scale even when raw-space kurtosis is large and positive", () => {
    // Real column from the same user-reported CSV: spans <1 decade (0.46-0.96), so a
    // log axis wouldn't meaningfully differ from a linear one — logScale must stay
    // false regardless of what a noisy skewness/kurtosis shape-fit says at N=50.
    const bloodSigma = [
      0.75131, 0.79399, 0.490335, 0.47301, 0.915867, 0.724899, 0.686434, 0.703126, 0.825238, 0.933432, 0.637843, 0.791281,
      0.514158, 0.564657, 0.549407, 0.802335, 0.473728, 0.561337, 0.890955, 0.536966, 0.83158, 0.553725, 0.865674, 0.48544,
      0.508699, 0.654994, 0.673807, 0.928775, 0.658729, 0.465125, 0.459668, 0.506026, 0.694636, 0.610325, 0.56998, 0.769325,
      0.756029, 0.871226, 0.648096, 0.943075, 0.496853, 0.533563, 0.584227, 0.862295, 0.743232, 0.955024, 0.628249, 0.586077,
      0.853509, 0.763633,
    ];

    const analysis = analyzeUploadedJobCollectionCsv(buildCsv("x", bloodSigma), { inferDistributionType: true });
    const preset = analysis.inputPresets.x;
    expect(preset?.distribution).toBe("uniform");
    if (preset?.distribution === "uniform") {
      expect(preset.scale).toBe("linear");
    }
  });

  it("B27/V33: with inferDistributionType, still falls back to uniform when there aren't enough samples and the data doesn't span >=2 orders of magnitude", () => {
    const csvContent = buildCsv("x", [1, 3, 5, 7, 9]);

    const analysis = analyzeUploadedJobCollectionCsv(csvContent, { inferDistributionType: true });

    expect(analysis.inputPresets.x).toEqual({
      distribution: "uniform",
      min: 1,
      max: 9,
      scale: "linear",
    });
  });

  it("B27/B30/V33/V36: with inferDistributionType, prefers log-uniform (uniform w/ scale=log) over plain uniform for positive data spanning >=2 orders of magnitude even with too few samples for a shape-fit comparison", () => {
    const csvContent = buildCsv("x", [1, 10, 100, 1000, 10000]);

    const analysis = analyzeUploadedJobCollectionCsv(csvContent, { inferDistributionType: true });

    const preset = analysis.inputPresets.x;
    expect(preset?.distribution).toBe("uniform");
    if (preset?.distribution === "uniform") {
      expect(preset.scale).toBe("log");
      expect(preset.min).toBe(1);
      expect(preset.max).toBe(10000);
    }
  });

  it("B28/V34: with inferDistributionType, rounds inferred uniform min/max to 3 significant digits, rounding outward so bounds still cover the observed data", () => {
    // stratified/evenly-spread values (like a uniform LHS design) over a narrow
    // (<2 orders of magnitude) range, N=10: reliably picks uniform via the shape-fit
    // path, exercising the min/max rounding rather than the log-normal branches.
    const n = 10;
    const rangeMin = 1.23456789;
    const rangeMax = 45.6789;
    const values = Array.from({ length: n }, (_, i) => rangeMin + ((i + 0.5) / n) * (rangeMax - rangeMin));

    const analysis = analyzeUploadedJobCollectionCsv(buildCsv("x", values), { inferDistributionType: true });

    const preset = analysis.inputPresets.x;
    const actualMin = Math.min(...values);
    const actualMax = Math.max(...values);
    expect(preset?.distribution).toBe("uniform");
    if (preset?.distribution === "uniform") {
      expect(preset.min).toBe(3.45); // floor(actualMin, 3 sig figs) <= actualMin
      expect(preset.max).toBe(43.5); // ceil(actualMax, 3 sig figs) >= actualMax
      expect(preset.min).toBeLessThanOrEqual(actualMin);
      expect(preset.max).toBeGreaterThanOrEqual(actualMax);
    }
  });
});

describe("computeDistributionParamsForType (B29/T25)", () => {
  it("returns undefined when there is no data", () => {
    expect(computeDistributionParamsForType([], "uniform")).toBeUndefined();
  });

  it("computes uniform min/max (rounded outward) + scale:log from data, regardless of the previously-selected type", () => {
    const params = computeDistributionParamsForType([1, 10, 100, 1000], "uniform");

    expect(params).toEqual({ min: 1, max: 1000, scale: "log" });
  });

  it("computes normal mean/std from data", () => {
    const params = computeDistributionParamsForType([1, 2, 3, 4, 5], "normal");

    expect(params?.mean).toBeCloseTo(3, 5);
    expect(params?.std).toBeGreaterThan(0);
  });

  it("computes constant value (mean of data) from data", () => {
    const params = computeDistributionParamsForType([2, 4, 6], "constant");

    expect(params).toEqual({ value: 4 });
  });

  it("computes normal linear mean/std from data", () => {
    const params = computeDistributionParamsForType([1, 2, 3], "normal");

    expect(params?.mean).toBeCloseTo(2, 5);
    expect(params?.std).toBeGreaterThan(0);
  });

  it("computes uniform min/max (with log scale inferred) from data", () => {
    const params = computeDistributionParamsForType([1, 10, 100], "uniform");

    expect(params?.min).toBe(1);
    expect(params?.max).toBe(100);
    expect(params?.scale).toBe("log");
  });
});
