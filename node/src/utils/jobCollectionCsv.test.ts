import { describe, it, expect, vi } from "vitest";
import { parseJobCollectionCsv, pickSingleCsvFile, serializeJobCollectionCsv, triggerCsvDownload } from "./jobCollectionCsv";

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

  describe("serializeJobCollectionCsv / parseJobCollectionCsv round-trip", () => {
    it("round-trips preamble + table data through serialize then parse", () => {
      const source = {
        sourceFunctionUid: "func-123",
        sourceJobCollectionUid: "jc-456",
        sourceJobCollectionTitle: "My Campaign",
        inputVars: ["x1", "x2"],
        outputVars: ["y"],
        rows: [
          { sourceJobUid: "job-1", status: "SUCCESS", inputs: { x1: 1.0, x2: 10.0 }, outputs: { y: 100.0 } },
          { sourceJobUid: "job-2", status: "SUCCESS", inputs: { x1: 2.0, x2: 20.0 }, outputs: { y: 200.0 } },
        ],
      };

      const csv = serializeJobCollectionCsv(source);
      const parsed = parseJobCollectionCsv(csv);

      expect(parsed.sourceFunctionUid).toBe(source.sourceFunctionUid);
      expect(parsed.sourceJobCollectionUid).toBe(source.sourceJobCollectionUid);
      expect(parsed.sourceJobCollectionTitle).toBe(source.sourceJobCollectionTitle);
      expect(parsed.inputVars).toEqual(source.inputVars);
      expect(parsed.outputVars).toEqual(source.outputVars);
      expect(parsed.rows).toEqual(source.rows);
    });
  });

  describe("triggerCsvDownload", () => {
    it("creates and clicks a download link with the CSV content as a blob", () => {
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
      const revokeObjectURLMock = vi.fn();
      URL.createObjectURL = createObjectURLMock;
      URL.revokeObjectURL = revokeObjectURLMock;
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      triggerCsvDownload("a,b,c\n1,2,3\n", "my_export.csv");

      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");

      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      clickSpy.mockRestore();
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
  });
});
