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


export function extractJobStatus(job: FunctionJob | SubJob): AllowedJobStatus {
    function classifyJobStatus(jobStatus: string): AllowedJobStatus {
      // This function helps homogenize job status, centralizing all corresponding logic
      const status = jobStatus
      if (!jobStatus) {
        throw new Error("JobStatus is undefined!")
      }
    
      if (jobStatus === "SUCCESS") {
        return "SUCCESS";
      }
      else if (status.endsWith("FAILED") || status.endsWith("FAILURE")) {
        return "FAILED"
      }
      else if (status === "STARTED" || status === "RUNNING") {
        return "RUNNING"
      }
      else if (status === "PENDING" || status.startsWith("JOB_") || status === "WAITING_") {
        return "PENDING"
      }
      else {
        console.warn("Could not classify JobStatus", jobStatus)
        return "UNKNOWN"
      }
    
    }

    if (!job) {
      throw new Error("Job is undefined");
    }

    // Check if job is of type SubJob (has 'selected' and 'job' properties)
    if (typeof job === "object" && "selected" in job && "job" in job) {
      // job is a SubJob, so use recursivity to extract status from its 'job' property
      return extractJobStatus(job.job);
      // previous way:  
      // typeof sj.job.status === "string"
      // ? sj.job.status
      // : (sj.job.status as unknown as { status: string }).status,
    }

    if (typeof job.status === "string") {
      return classifyJobStatus(job.status);
    }
    else if (job.status && typeof job.status === "object" && "status" in job.status) {
      return classifyJobStatus((job.status as { status: string }).status);
    }
    else {
      console.log("Could not extract status of job ", job)
      return "UNKNOWN";
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

export function filterForFinalStatus(status: string) {
  return status === "FAILED" || status === "SUCCESS";
}
