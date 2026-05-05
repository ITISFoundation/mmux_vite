import { describe, expect, it } from "vitest";
import { analyzeUploadedJobCollectionCsv } from "./jobCollectionCsv";

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
});
