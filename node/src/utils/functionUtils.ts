import { toast } from "react-toastify";
import { ProjectFunctionJob, RegisteredFunctionJobCollection } from "osparc-api-ts-client";
import { RegisteredFunction, OsparcFunctionJob } from "../context/types";
import { fetchWithRetry } from "./fetchRetry";

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
// KNOWN GAP (live bug, not yet fixed, own follow-up branch/PR): this only
// protects the read path (backend -> FE response). The write path (FE ->
// backend request body) has no equivalent guard yet, and the backend's
// `to_snake_case_request` (flaskapi/utils/json_serializer.py) blindly
// case-converts every incoming key unconditionally — so any irregular-case
// variable name (e.g. "TissueConduc", "peak_Averaged_Field", not just
// "sigma_blood"-style all-lowercase) sent back in a job config / slider
// values / distribution params body gets mangled on arrival today. Plan
// (node/SPEC.md T13+T19, grilled 2026-07-02): audit every outgoing fetch()
// body + Flask endpoint first to enumerate the real key-set, then extend
// THIS Set+parentKey pattern (not the heavier `FunctionVariablesDict`
// Pydantic-wrapper design from the closed/superseded PR #469, which had its
// own unresolved B8/B9 bugs) to both the backend converter and a new FE
// `camelToSnakeCase`/`toBackendVarNames` outgoing conversion, with a
// cross-language equality test keeping the two lists in sync (no shared
// runtime file). Test-first: red against today's code, then green.
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
  const result = await fetch(`/flask/deployment/health`);
  return result.status;
}

export async function getPermissions(): Promise<string> {
  const result = await fetch(`/flask/deployment/permissions`);
  const permissionsPayload = (await result.json()) as { permissions: string };
  return permissionsPayload.permissions;
}

export async function getServiceMode(): Promise<string> {
  const result = await fetch(`/flask/deployment/service-mode`);
  const serviceModePayload = normalizePayloadToCamelCase<{ serviceMode?: string }>(await result.json());
  return serviceModePayload.serviceMode ?? "";
}

export async function listFunctions(): Promise<RegisteredFunction[]> {
  const result = await fetchWithRetry(`/flask/osparc/list_functions`);
  return normalizePayloadToCamelCase<RegisteredFunction[]>(await result.json());
}

export async function listJobs(): Promise<OsparcFunctionJob[]> {
  return fetchWithRetry(`/flask/osparc/list_jobs`).then(async response =>
    normalizePayloadToCamelCase<OsparcFunctionJob[]>(await response.json()),
  );
}

export async function getFunctionJobsFromFunctionUid(functionUid: string): Promise<OsparcFunctionJob[]> {
  return fetch(`/flask/osparc/list_function_jobs_for_functionid?functionUid=${functionUid}`).then(async response =>
    normalizePayloadToCamelCase<OsparcFunctionJob[]>(await response.json()),
  );
}

export async function getFunctionJobCollections(functionUid: string): Promise<RegisteredFunctionJobCollection[]> {
  return fetchWithRetry(`/flask/osparc/list_function_job_collections_for_functionid?functionUid=${functionUid}`).then(
    async response => normalizePayloadToCamelCase<RegisteredFunctionJobCollection[]>(await response.json()),
  );
}

export async function getFunctionJobsFromFunctionJobCollection(jobCollectionUid: string): Promise<OsparcFunctionJob[]> {
  return fetchWithRetry(`/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=${jobCollectionUid}`).then(
    async response => normalizePayloadToCamelCase<OsparcFunctionJob[]>(await response.json()),
  );
}

export async function downloadJobCollectionCsv(jobCollectionUid: string): Promise<string> {
  const response = await fetchWithRetry(`/flask/osparc/download_job_collection_csv?JobCollectionUid=${jobCollectionUid}`);
  return response.text();
}

export async function uploadJobCollectionCsv(params: {
  csvContent: string;
  targetMode: "existing" | "new";
  targetFunctionUid?: string;
  newFunctionTitle?: string;
  sourceFunctionUid?: string;
}) {
  const response = await fetch(`/flask/sampling/upload_job_collection_csv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || "Failed to upload JobCollection CSV");
  }

  return response.json();
}

export function getSimplifiedHost(): string {
  const serviceAddress = window.location.href;
  const url = new URL(serviceAddress);
  const simplifiedHost = url.hostname.replace(/^[^.]+\.services\./, ""); // get rid of the UUID and "services"
  return simplifiedHost;
}

export function getDeploymentUrl(): string {
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
    const response = await fetch(`/flask/sampling/clone_job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        functionName, //
        projectJobId,
        projectInputs: inputs,
      }),
    });

    if (!response.ok) throw new Error(`Failed to open job copy: ${response.statusText}`);

    const study: StudyType = await response.json();

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
