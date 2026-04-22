import { toast } from "react-toastify";
import { Function as OsparcFunction, ProjectFunctionJob, FunctionJob, FunctionJobCollection } from "../osparc-api-ts-client";
import { pythonDakotaBackend } from "./api_objects";
import { fetchWithRetry } from "./fetch_retry";

function snakeToCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_match, char: string) => char.toUpperCase());
}

function normalizePayloadToCamelCase<T>(payload: unknown): T {
  if (Array.isArray(payload)) {
    return payload.map(item => normalizePayloadToCamelCase(item)) as T;
  }

  if (payload && typeof payload === "object") {
    return Object.entries(payload as Record<string, unknown>).reduce(
      (normalized, [key, value]) => ({
        ...normalized,
        [snakeToCamelCase(key)]: normalizePayloadToCamelCase(value),
      }),
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
  const result = await fetch(`${pythonDakotaBackend}/flask/deployment/health`);
  return result.status;
}

export async function getPermissions(): Promise<string> {
  const result = await fetch(`${pythonDakotaBackend}/flask/deployment/permissions`);
  const permissionsPayload = (await result.json()) as { permissions: string };
  return permissionsPayload.permissions;
}

export async function getServiceMode(): Promise<string> {
  const result = await fetch(`${pythonDakotaBackend}/flask/deployment/service-mode`);
  const serviceModePayload = normalizePayloadToCamelCase<{ serviceMode?: string }>(await result.json());
  return serviceModePayload.serviceMode ?? "";
}

export async function listFunctions(): Promise<OsparcFunction[]> {
  const result = await fetchWithRetry(`${pythonDakotaBackend}/flask/osparc/list_functions`);
  return normalizePayloadToCamelCase<OsparcFunction[]>(await result.json());
}

export async function listJobs(): Promise<FunctionJob[]> {
  return fetchWithRetry(`${pythonDakotaBackend}/flask/osparc/list_jobs`).then(async response =>
    normalizePayloadToCamelCase<FunctionJob[]>(await response.json()),
  );
}

export async function getFunctionJobsFromFunctionUid(functionUid: string): Promise<FunctionJob[]> {
  return fetch(`${pythonDakotaBackend}/flask/osparc/list_function_jobs_for_functionid?functionUid=${functionUid}`).then(
    async response => normalizePayloadToCamelCase<FunctionJob[]>(await response.json()),
  );
}

export async function getFunctionJobCollections(functionUid: string): Promise<FunctionJobCollection[]> {
  return fetchWithRetry(
    `${pythonDakotaBackend}/flask/osparc/list_function_job_collections_for_functionid?functionUid=${functionUid}`,
  ).then(async response => normalizePayloadToCamelCase<FunctionJobCollection[]>(await response.json()));
}

export async function getFunctionJobsFromFunctionJobCollection(jobCollectionUid: string): Promise<FunctionJob[]> {
  return fetchWithRetry(
    `${pythonDakotaBackend}/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=${jobCollectionUid}`,
  ).then(async response => normalizePayloadToCamelCase<FunctionJob[]>(await response.json()));
}

export async function downloadJobCollectionCsv(jobCollectionUid: string): Promise<string> {
  const response = await fetchWithRetry(
    `${pythonDakotaBackend}/flask/osparc/download_job_collection_csv?JobCollectionUid=${jobCollectionUid}`,
  );
  return response.text();
}

export async function uploadJobCollectionCsv(params: {
  csvContent: string;
  targetMode: "existing" | "new";
  targetFunctionUid?: string;
  newFunctionTitle?: string;
  sourceFunctionUid?: string;
}) {
  const response = await fetch(`${pythonDakotaBackend}/flask/sampling/upload_job_collection_csv`, {
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
    const response = await fetch(`${pythonDakotaBackend}/flask/sampling/clone_job`, {
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

export function aggregateInputValues(jobs: FunctionJob[]): Record<string, number[]> {
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

export function aggregateOutputValues(jobs: FunctionJob[]): Record<string, number[]> {
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
