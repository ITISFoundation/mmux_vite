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
  const result = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/list_functions`);
  return result.json();
}

export async function listJobs(): Promise<FunctionJob[]> {
  return fetchWithRetry(`${PYTHON_DAKOTA_BACKEND}/flask/list_jobs`).then(response => response.json());
}

export async function getFunctionJob(jobUid: string): Promise<FunctionJob> {
  return fetchWithRetry(`${PYTHON_DAKOTA_BACKEND}/flask/get_function_job?jobUid=${jobUid}`).then(response => response.json());
}

export async function getFunctionJobsFromFunctionUid(functionUid: string): Promise<FunctionJob[]> {
  return fetch(`${PYTHON_DAKOTA_BACKEND}/flask/list_function_jobs_for_functionid?functionUid=${functionUid}`).then(response =>
    response.json(),
  );
  // return MOCKUP_JOBS
}

export async function getFunctionJobCollections(functionUid: string): Promise<FunctionJobCollection[]> {
  return fetch(
    // PYTHON_DAKOTA_BACKEND + '/flask/list_function_job_collections_for_functionid?functionUid=' + functionUid,
    `${PYTHON_DAKOTA_BACKEND}/flask/list_function_job_collections_for_functionid?functionUid=${functionUid}`,
  ).then(response => response.json());
}

export async function getFunctionJobsFromFunctionJobCollection(JobCollectionUid: string): Promise<FunctionJob[]> {
  return fetch(`${PYTHON_DAKOTA_BACKEND}/flask/list_function_jobs_for_jobcollectionid?JobCollectionUid=${JobCollectionUid}`).then(
    response => response.json(),
  );
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
    const study: StudyType = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/clone_job`, {
      method: "POST",
      body: JSON.stringify({
        functionName, //
        projectJobId,
        projectInputs: inputs,
      }),
    }).then(response => response.json());

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
