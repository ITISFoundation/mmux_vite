import { toast } from "react-toastify";
import { Function as OsparcFunction, FunctionJob as OsparcFunctionJob, ProjectFunctionJob } from "../osparc-api-ts-client";
import { createJobStudyCopy, openStudyUid } from "./function_utils";

export async function runSingleJob(
  selectedFunction: OsparcFunction | undefined,
  jobInputs: SingleJobConfig[],
  setLaunchingSampling: (value: boolean) => void,
) {
  if (!selectedFunction) {
    toast.error("No function selected. Please select a function before running the job.");
    return;
  }
  const fun = selectedFunction as OsparcFunction;
  // send config to Python backend to create LHS
  setLaunchingSampling(true);
  const job = await fetch(`/flask/sampling/test_job`, {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config: jobInputs,
    }),
  })
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error running Single Job ${response.status}: ${errorText}`);
      }
      return response.json();
    })
    .then((k: OsparcFunctionJob) => k)
    .catch(error => {
      console.error("Error running single job: ", error);
    });
  setLaunchingSampling(false);
  if (!job) {
    toast.warning("Test Job running failed! Please contact support");
    return; // Avoid creating copy if runTestJob fails
  }
  // necessary to make a copy of the test job bcs as of now, the run-job always generates a hidden copy
  // thus, the copy allows the user to see their test run in their dashboard
  // WOuld be nice to be able to abort/delete the TestJob or simply update the run-job endpoint to accept a "hidden" boolean parameter
  const copyUid = await createJobStudyCopy(selectedFunction?.title as string, job as ProjectFunctionJob);
  if (copyUid instanceof Error) {
    toast.warning(`Not possible to open your Job! ${copyUid.message} Please contact support`);
  } else if (!copyUid) {
    toast.warning("Not possible to open your Job! Please contact support");
  } else if (job && job.functionClass && job.functionClass === "PROJECT") {
    openStudyUid(copyUid as string);
  } else {
    toast.warning("Only ProjectFunctionJob can be opened in a new window!");
  }
}

/// TODO make this more modular and also include the LHS, Grid, etc
/// abstract redundant code
