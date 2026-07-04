import { describe, it, expect, vi } from "vitest";
import { analyzeUploadedJobCollectionCsv, parseJobCollectionCsv, pickSingleCsvFile } from "./jobCollectionCsv";

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

      expect(result.inputPresets.x1).toEqual({ distribution: "uniform", min: 1.0, max: 5.0, logScale: false });
    });

    it("infers log-scale when values span >=2 orders of magnitude", () => {
      const csv = [
        "source_job_uid,status,input__x1,output__y",
        "job-1,SUCCESS,0.001,10.0",
        "job-2,SUCCESS,10,20.0",
        "job-3,SUCCESS,100,30.0",
      ].join("\n");

      const result = parseJobCollectionCsv(csv);

      expect(result.inputPresets.x1.logScale).toBe(true);
    });

    it("does not infer log-scale when values are non-positive or narrow-range", () => {
      const csv = [
        "source_job_uid,status,input__x1,input__x2,output__y",
        "job-1,SUCCESS,-1.0,1.0,10.0",
        "job-2,SUCCESS,2.0,1.5,20.0",
      ].join("\n");

      const result = parseJobCollectionCsv(csv);

      expect(result.inputPresets.x1.logScale).toBe(false);
      expect(result.inputPresets.x2.logScale).toBe(false);
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
      expect(result.inputPresets.x1).toEqual({ distribution: "uniform", min: 2.0, max: 2.0, logScale: false });
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
      logScale: true,
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
      logScale: false,
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

  it("with inferDistributionType, selects log-normal for exponentiated bell-shaped data and rounds to 3 significant digits", () => {
    const values = normalLikeValues.map(position => Math.exp(position));
    const analysis = analyzeUploadedJobCollectionCsv(buildCsv("x", values), { inferDistributionType: true });

    const preset = analysis.inputPresets.x;
    expect(preset?.distribution).toBe("log-normal");
    if (preset?.distribution === "log-normal") {
      expect(preset.logMean).toBeCloseTo(0, 5);
      expect(preset.logStd).toBeGreaterThan(0);
      // rounded to 3 significant digits
      expect(preset.logStd).toBe(Number(preset.logStd.toPrecision(3)));
    }
  });

  it("with inferDistributionType, still falls back to uniform when there aren't enough samples", () => {
    const csvContent = buildCsv("x", [1, 10, 100, 1000, 10000]);

    const analysis = analyzeUploadedJobCollectionCsv(csvContent, { inferDistributionType: true });

    expect(analysis.inputPresets.x).toEqual({
      distribution: "uniform",
      min: 1,
      max: 10000,
      logScale: true,
    });
  });
});
