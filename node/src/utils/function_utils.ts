import { toast } from "react-toastify";
import { Function as OsparcFunction, ProjectFunctionJob, FunctionJob, FunctionJobCollection } from "../osparc-api-ts-client";
import { PYTHON_DAKOTA_BACKEND } from "./api_objects";
import { fetchWithRetry } from "./fetch_retry";

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
  const result = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/health`);
  return result.status;
}

export async function getPermissions(): Promise<string> {
  const result = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/permissions`);
  const permissionsJson = await result.json();
  return permissionsJson.permissions;
}

export async function getServiceMode(): Promise<string> {
  const result = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/service-mode`);
  const ServiceModeJson = await result.json();
  return ServiceModeJson.service_mode;
}

export async function listFunctions(): Promise<OsparcFunction[]> {
  const result = await fetchWithRetry(`${PYTHON_DAKOTA_BACKEND}/flask/list_functions`);
  return result.json();
}

export async function listJobs(): Promise<FunctionJob[]> {
  return fetchWithRetry(`${PYTHON_DAKOTA_BACKEND}/flask/list_jobs`).then(response => response.json());
}

export async function getFunctionJobsFromFunctionUid(functionUid: string): Promise<FunctionJob[]> {
  return fetch(`${PYTHON_DAKOTA_BACKEND}/flask/list_function_jobs_for_functionid?functionUid=${functionUid}`).then(response =>
    response.json(),
  );
}

export async function getFunctionJobCollections(functionUid: string): Promise<FunctionJobCollection[]> {
  return fetchWithRetry(
    `${PYTHON_DAKOTA_BACKEND}/flask/list_function_job_collections_for_functionid?functionUid=${functionUid}`,
  ).then(response => response.json());
}

export async function getFunctionJobsFromFunctionJobCollection(JobCollectionUid: string): Promise<FunctionJob[]> {
  return fetchWithRetry(
    `${PYTHON_DAKOTA_BACKEND}/flask/list_function_jobs_for_jobcollectionid?JobCollectionUid=${JobCollectionUid}`,
  ).then(response => response.json());
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
    const { projectJobId } = job;
    const { inputs } = job;
    const response = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/clone_job`, {
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

export type AllowedJobStatus = "SUCCESS" | "FAILED" | "RUNNING" | "PENDING" | "UNKNOWN";

export function isSubJob(job: FunctionJob | SubJob): job is SubJob {
  if (!job) {
      throw new Error("Job is undefined");
  }

  if (typeof job === "object") {
    return (job as SubJob).selected !== undefined && (job as SubJob).job !== undefined;
  }
  else {
    return false;
  }
}

export function isFunctionJob(job: FunctionJob | SubJob): job is FunctionJob {
  if (!job) {
      throw new Error("Job is undefined");
  }
  
  if (typeof job === "object") {
    return (job as FunctionJob).inputs !== undefined && (job as FunctionJob).functionUid !== undefined && (job as FunctionJob).status !== undefined;
  }
  else {
    return false;
  }
}

function classifyJobStatus(jobStatus: string): AllowedJobStatus {
  // This function helps homogenize job status into four categories + unknown,
  // centralizing all corresponding logic
    if (!jobStatus) {
      throw new Error("JobStatus is undefined!")
    }
  
    if (jobStatus === "SUCCESS") {
      return "SUCCESS";
    }
    else if (jobStatus.endsWith("FAILED") || jobStatus.endsWith("FAILURE")) {
      return "FAILED";
    }
    else if (jobStatus === "STARTED" || jobStatus === "RUNNING") {
      return "RUNNING";
    }
    else if (jobStatus === "PENDING" || jobStatus.startsWith("JOB_") || jobStatus.startsWith("WAITING_") || jobStatus === "PUBLISHED") {
      return "PENDING"
    }
    else {
      console.warn("Could not classify JobStatus", jobStatus)
      return "UNKNOWN"
    }
}

export function extractJobStatus(job: FunctionJob | SubJob): AllowedJobStatus {
  // This function extracts the job status from either a FunctionJob or a SubJob
  // allowing for status to be either a string or an object with a status field
  // and classifies it into one of the AllowedJobStatus categories
  if (isFunctionJob(job)) {
    if (typeof job.status === "string") {
      return classifyJobStatus(job.status);
    }
    else if (job.status && typeof job.status === "object" && "status" in job.status && typeof job.status.status === "string") {
      return classifyJobStatus((job.status as { status: string }).status);
    }
    else {
      console.log(`job status ${job.status} could not be extracted, classifying as UNKNOWN.`);
      return "UNKNOWN";
    }
  }
  // If it's a SubJob, recurse to extract from the inner job
  else if (isSubJob(job)) {
    return extractJobStatus(job.job);
  }
  else {
    throw new Error("Job passed to extractJobStatus is neither FunctionJob nor SubJob!");
  }
  }

export function extractJobOutputs(job: FunctionJob | SubJob): Record<string, unknown> {
  // This function extracts the job outputs from either a FunctionJob or a SubJob
  // allowing for outputs to be either a Record<string, unknown> or an object with an outputs field
  if (isFunctionJob(job)) {
    if (job.outputs && typeof job.outputs === "object") {
      return job.outputs as Record<string, unknown>;
    }
    else if (job.outputs && typeof job.outputs === "object" && "outputs" in job.outputs && typeof job.outputs.outputs === "object") {
      return job.outputs.outputs as Record<string, unknown>;
    }
    else {
      console.log(`job outputs ${job.outputs} could not be extracted, returning empty object.`);
      return {};
    }
  }
  // If it's a SubJob, recurse to extract from the inner job
  else if (isSubJob(job)) {
    return extractJobOutputs(job.job);
  }
  else {
    throw new Error("Job passed to extractJobOutputs is neither FunctionJob nor SubJob!");
  }
}

export function getJobStatusCounts(subJobs: SubJob[]): JobStatusCounts {
  return subJobs
    .filter(j => j.job)
    .map(j => extractJobStatus(j.job))
    .reduce(
      (acc, status: AllowedJobStatus) => {
        if (status === "SUCCESS") acc.success += 1;
        else if (status === "FAILED") acc.failed += 1;
        else if (status === "RUNNING") acc.running += 1;
        else if (status === "PENDING") acc.pending += 1;
        else if (status === "UNKNOWN") acc.unknown += 1;
        else {
          console.warn("status should have been classified into one of the AllowedJobStatus!")
          console.warn("status: ", status)
        };
        return acc;
      },
      { success: 0, failed: 0, running: 0, pending: 0, unknown: 0 },
    );
}

export function getJobCollectionStatus(subJobs: SubJob[]) {
  if (!subJobs || subJobs.length === 0) return "NO JOBS";
  const jobStatusCounts = getJobStatusCounts(subJobs);
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
  else return "UNKNOWN";
}

export function isFinalStatus(status: string) {
  return status === "FAILED" || status === "SUCCESS";
}
