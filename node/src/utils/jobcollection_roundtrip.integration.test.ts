import { describe, expect, it, vi } from "vitest";
import { getFunctionJobCollections, getFunctionJobsFromFunctionUid, listFunctions } from "./functionUtilsMockups";
import { uploadJobCollectionCsv } from "./functionUtils";

function buildCsvFromMockupData(args: {
  functionUid: string;
  jobCollectionUid: string;
  rows: Array<{ uid: string; status: string; x: number; y: number; result: number }>;
}) {
  const header =
    "schema_version,source_job_collection_uid,source_function_uid,source_job_uid,status,input__x,input__y,output__result";
  const body = args.rows
    .map(row => `1,${args.jobCollectionUid},${args.functionUid},${row.uid},${row.status},${row.x},${row.y},${row.result}`)
    .join("\n");
  return `${header}\n${body}`;
}

describe("JobCollection CSV roundtrip with mockups", () => {
  it("reuploads downloaded mockup CSV to existing and new function targets", async () => {
    const functions = await listFunctions();
    const functionUid = functions[0].uid;

    const collections = await getFunctionJobCollections(functionUid);
    const jobs = await getFunctionJobsFromFunctionUid(functionUid);

    const firstCollection = collections[0];
    const selectedJobIds = firstCollection.jobIds ?? [];
    const selectedJobs = jobs.filter(job => selectedJobIds.includes(job.uid));
    const csvContent = buildCsvFromMockupData({
      functionUid,
      jobCollectionUid: firstCollection.uid || "mock-jc",
      rows: selectedJobs.map(job => ({
        uid: job.uid,
        status: String(job.status),
        x: Number((job.inputs as Record<string, unknown>).x),
        y: Number((job.inputs as Record<string, unknown>).y),
        result: Number((job.outputs as Record<string, unknown>).result),
      })),
    });

    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ targetMode: "existing", targetFunctionUid: functionUid }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ targetMode: "new", targetFunctionUid: "new-func-1" }),
      });

    vi.stubGlobal("fetch", fetchSpy as unknown as typeof fetch);

    const existingResponse = await uploadJobCollectionCsv({
      csvContent,
      targetMode: "existing",
      targetFunctionUid: functionUid,
    });
    expect(existingResponse.targetMode).toBe("existing");

    const newResponse = await uploadJobCollectionCsv({
      csvContent,
      targetMode: "new",
      sourceFunctionUid: functionUid,
      newFunctionTitle: "Uploaded JobCollection Function",
    });
    expect(newResponse.targetMode).toBe("new");

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const firstPayload = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    const secondPayload = JSON.parse(String(fetchSpy.mock.calls[1][1]?.body));
    expect(firstPayload.targetMode).toBe("existing");
    expect(secondPayload.targetMode).toBe("new");
  });
});
