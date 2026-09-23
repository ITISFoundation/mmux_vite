import { toast } from "react-toastify";
import { ProjectFunctionJob, RegisteredFunctionJobCollection } from "osparc-api-ts-client";
import { RegisteredFunction, OsparcFunctionJob } from "../context/types";
import { ApiError, requestJson } from "../api/client";
import { UploadJobCollectionCsvResponse, UploadJobCollectionCsvParams } from "./types";

function snakeToCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_match, char: string) => char.toUpperCase());
}

// Keys whose *own* nested keys are oSPARC/user-defined variable identifiers
// (e.g. "sigma_blood"), not API field names — they must be preserved verbatim.
// Case-converting them corrupts the identifiers oSPARC expects, which breaks
// every downstream request built from them (400 on validation/plots/UQ
// propagation). See node/SPEC.md V24, B18.
// NOTE: these entries are camelCase (e.g. "defaultInputs", not "default_inputs")
// because membership is checked against `camelKey` *after* conversion (see
// `normalizePayloadToCamelCase` below) — keep them camelCase, do not "fix" to
// snake_case.
//
// Write path (FE -> backend request body): fixed on the backend side only
// (flaskapi/src/mmux_flaskapi/utils/helpers.py `_DEFAULT_PRESERVE_NESTED_KEYS`,
// applied in `to_snake_case_request`/`json_serializer.py`) — the backend now
// passes `distributions`/`sliderValues`/`outputVarSelection`/`projectInputs`
// subtrees through untouched, so no FE-side outgoing camelToSnakeCase
// conversion utility is needed (deliberately not built — would be dead code
// with no caller; see node/SPEC.md T13/T19, grilled 2026-07-02). Covered by
// flaskapi's `test_utils_helpers.py::TestPreserveNestedKeysForVariableNames`,
// the cross-language subset tripwire test
// (`test_preserve_nested_keys_matches_frontend_opaque_keys`), and an
// end-to-end regression test in `test_flask_dakota_workflows.py`. Do NOT
// resurrect the `FunctionVariablesDict`/Pydantic-wrapper approach from the
// closed, superseded PR #469 (JavierGOrdonnez/port-be-preserve-case) — it had
// its own unresolved bugs (B8/B9) and didn't merge cleanly.
const opaqueValueDictKeys = new Set(["properties", "defaultInputs", "inputs", "outputs"]);

function normalizePayloadToCamelCase<T>(payload: unknown, parentKey?: string): T {
  if (Array.isArray(payload)) {
    return payload.map(item => normalizePayloadToCamelCase(item, parentKey)) as T;
  }

  if (payload && typeof payload === "object") {
    if (parentKey && opaqueValueDictKeys.has(parentKey)) {
      return payload as T;
    }

    return Object.entries(payload as Record<string, unknown>).reduce(
      (normalized, [key, value]) => {
        const camelKey = snakeToCamelCase(key);
        return {
          ...normalized,
          [camelKey]: normalizePayloadToCamelCase(value, camelKey),
        };
      },
      {} as Record<string, unknown>,
    ) as T;
  }

  return payload as T;
}

export function createInputOutputSchema(vars: string[]) {
  return {
    type: "object",
    properties: vars.reduce(
      (acc, curr) => {
        acc[curr] = { type: "number" };
        return acc;
      },
      {} as Record<string, unknown>,
    ),
    required: vars,
  };
}

export async function getHealth(): Promise<number> {
  try {
    await requestJson(`/flask/deployment/health`);
    return 200;
  } catch (error) {
    if (error instanceof ApiError && error.status !== undefined) return error.status;
    throw error;
  }
}

export async function getPermissions(): Promise<string> {
  const payload = await requestJson<{ permissions: string }>(`/flask/deployment/permissions`);
  return payload.permissions;
}

export async function getServiceMode(): Promise<string> {
  const payload = normalizePayloadToCamelCase<{ serviceMode?: string }>(await requestJson(`/flask/deployment/service-mode`));
  return payload.serviceMode ?? "";
}

export async function listFunctions(): Promise<RegisteredFunction[]> {
  return normalizePayloadToCamelCase<RegisteredFunction[]>(await requestJson(`/flask/osparc/list_functions`, { retry: true }));
}

export async function listJobs(): Promise<OsparcFunctionJob[]> {
  return normalizePayloadToCamelCase<OsparcFunctionJob[]>(await requestJson(`/flask/osparc/list_jobs`, { retry: true }));
}

export async function getFunctionJobsFromFunctionUid(functionUid: string): Promise<OsparcFunctionJob[]> {
  return normalizePayloadToCamelCase<OsparcFunctionJob[]>(
    await requestJson(`/flask/osparc/list_function_jobs_for_functionid?functionUid=${functionUid}`, { retry: true }),
  );
}

export async function getFunctionJobCollections(functionUid: string): Promise<RegisteredFunctionJobCollection[]> {
  return normalizePayloadToCamelCase<RegisteredFunctionJobCollection[]>(
    await requestJson(`/flask/osparc/list_function_job_collections_for_functionid?functionUid=${functionUid}`, {
      retry: true,
    }),
  );
}

export async function getFunctionJobsFromFunctionJobCollection(jobCollectionUid: string): Promise<OsparcFunctionJob[]> {
  return normalizePayloadToCamelCase<OsparcFunctionJob[]>(
    await requestJson(`/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=${jobCollectionUid}`, {
      retry: true,
    }),
  );
}

export async function uploadJobCollectionCsv(params: UploadJobCollectionCsvParams): Promise<UploadJobCollectionCsvResponse> {
  try {
    return normalizePayloadToCamelCase<UploadJobCollectionCsvResponse>(
      await requestJson(`/flask/sampling/upload_job_collection_csv`, { method: "POST", body: params }),
    );
  } catch (error) {
    let backendMessage: string | undefined;
    try {
      backendMessage = (JSON.parse((error as ApiError).body ?? "") as { error?: string }).error;
    } catch {
      backendMessage = undefined;
    }
    throw new Error(backendMessage || "Failed to upload JobCollection CSV", { cause: error });
  }
}

export function getSimplifiedHost(): string {
  const serviceAddress = window.location.href;
  const url = new URL(serviceAddress);
  const simplifiedHost = url.hostname.replace(/^[^.]+\.services\./, ""); // get rid of the UUID and "services"
  return simplifiedHost;
}

function getDeploymentUrl(): string {
  const serviceAddress = window.location.href;
  const url = new URL(serviceAddress);
  const simplifiedHost = url.hostname.replace(/^[^.]+\.services\./, ""); // get rid of the UUID and "services"
  const deploymentUrl = `${url.protocol}//${simplifiedHost}`; // add the protocol
  return deploymentUrl;
}

export function openStudyUid(uid: string): void {
  const deploymentUrl = getDeploymentUrl();
  const serviceUrl = `${deploymentUrl}/#/study/${uid}`;
  const newWindow = window.open(serviceUrl);
  if (newWindow) {
    console.info("Window opened successfully");
  } else {
    toast.warning("Popup blocked! Please allow popups for this site to open the job in a new tab.");
  }
}

interface StudyType {
  uid: string;
  title: string;
  description: string;
}
export const createJobStudyCopy = async (functionName: string, job: ProjectFunctionJob) => {
  let error: Error = new Error();
  try {
    const normalizedJob = normalizePayloadToCamelCase<ProjectFunctionJob>(job);
    const { projectJobId } = normalizedJob;
    const { inputs } = normalizedJob;
    const study = await requestJson<StudyType>(`/flask/sampling/clone_job`, {
      method: "POST",
      body: {
        functionName, //
        projectJobId,
        projectInputs: inputs,
      },
    });

    if (study && study.uid) {
      return study.uid;
    }
    toast.error("Failed to open job copy: No UID returned");
    error = new Error("Failed to open job copy: No UID returned");
  } catch (err) {
    console.error("Error creating Job Copy for inspection:", err);
    toast.error("Error creating Job Copy for inspection");
    error = new Error("Error creating Job Copy for inspection", { cause: err as Error });
  }
  return error;
};

export function aggregateInputValues(jobs: OsparcFunctionJob[]): Record<string, number[]> {
  const inputValues: Record<string, number[]> = {};

  jobs.forEach(job => {
    if (job.inputs && typeof job.inputs === "object") {
      Object.entries(job.inputs).forEach(([key, value]) => {
        if (typeof value === "number") {
          if (!inputValues[key]) inputValues[key] = [];
          inputValues[key].push(value);
        }
      });
    }
  });

  return inputValues;
}

export function aggregateOutputValues(jobs: OsparcFunctionJob[]): Record<string, number[]> {
  const outputValues: Record<string, number[]> = {};

  jobs.forEach(job => {
    if (job.outputs && typeof job.outputs === "object") {
      Object.entries(job.outputs).forEach(([key, value]) => {
        if (typeof value === "number") {
          if (!outputValues[key]) outputValues[key] = [];
          outputValues[key].push(value);
        }
      });
    }
  });

  return outputValues;
}

// Helper function to count job statuses
export type JobStatusCounts = {
  success: number;
  running: number;
  failed: number;
  pending: number;
  unknown: number;
};

export function getJobStatusCounts(subJobs: SubJob[]): JobStatusCounts {
  return subJobs
    .filter(j => j.job)
    .map(j => (typeof j.job.status === "string" ? j.job.status : (j.job.status as unknown as { status: string }).status))
    .reduce(
      (acc, status: string) => {
        if (status === "SUCCESS") acc.success += 1;
        else if (status.endsWith("FAILED") || status.endsWith("FAILURE")) acc.failed += 1;
        else if (status === "STARTED" || status === "RUNNING") acc.running += 1;
        else if (status === "PENDING" || status.startsWith("JOB_") || status.startsWith("WAITING_") || status === "PUBLISHED")
          acc.pending += 1;
        else acc.unknown += 1;
        return acc;
      },
      { success: 0, failed: 0, running: 0, pending: 0, unknown: 0 },
    );
}

export function getJobCollectionStatus(subJobs: SubJob[]) {
  if (!subJobs || subJobs.length === 0) return "NO JOBS";
  const jobStatusCounts = getJobStatusCounts(subJobs);
  if (jobStatusCounts.unknown > 0) {
    // toast.warn("Could not classify some job statuses - please revise console logs")
    console.warn("SubJobs that gave UNKNOWN status: ", subJobs);
  }
  const allSuccess = jobStatusCounts.success === subJobs.length;
  const anySuccess = jobStatusCounts.success > 0;
  const anyRunning = jobStatusCounts.running > 0;
  const anyFailed = jobStatusCounts.failed > 0;
  const allFailed = jobStatusCounts.failed === subJobs.length;
  const anyPending = jobStatusCounts.pending > 0;
  if (allSuccess) return "COMPLETE";
  if (allFailed) return "FAILED";
  if (anyRunning) return "RUNNING";
  if (anyPending) return "PENDING";
  if (anyFailed && anySuccess) return "FAILED PARTIALLY";
  return "UNKNOWN";
}

export function filterForFinalStatus(status: string) {
  return status === "FAILED" || status === "SUCCESS" || status.includes("FAILURE");
}
