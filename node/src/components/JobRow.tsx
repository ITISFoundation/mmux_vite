import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { Box, Button, Checkbox, CircularProgress, Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import { useState } from "react";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import { openStudyUid } from "../utils/function_utils";
import { Function, ProjectFunctionJob } from "../osparc-api-ts-client";

interface JobRowProps {
  jobUid: string
  setSelected: (selected: boolean, subJob: string) => void;
  jobList: SubJob[];
  selectedFunction?: Function;
}

const JobRow = (props: JobRowProps) => {
  const { jobUid, jobList, setSelected, selectedFunction } = props;
  const job = jobList.find(j => j.job.uid === jobUid);
  const [creatingJobCopy, setCreatingJobCopy] = useState(false)

  const handleSetJob = (selected: boolean) => {
    setSelected(selected, jobUid);
  };

  if (job === undefined) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Typography variant="body1" gutterBottom component="div">
            Loading job {jobUid}...
          </Typography>
        </TableCell>
      </TableRow>
    );
  } else {
    const jobStatus = job.job.status;
    const outputs =
      // (job.job.outputs) ?
      (jobStatus === "SUCCESS")
        ? Object.entries(job.job.outputs).map(([key, value], idx) => {
          return (
            <Box key={idx} display={"inline"}>
              {key} : {(value as number).toExponential(3)}{", "}
            </Box>
          );
        })
        : (jobStatus === "STARTED")
          ? [
            <Box key={0} display={"inline"}>
              {"Running..."}
            </Box >
          ]
          : (jobStatus === "FAILED")
            ? "No outputs"
            : (jobStatus === "PENDING") || (jobStatus === "WAITING_FOR_CLUSTER") || (jobStatus === "PUBLISHED") // both are valid options
              ? "Pending to run"
              : "Unknown status, please contact support"

    const inputs = Object.entries(job.job.inputs).map(([key, value], idx) => {
      return (
        <Box key={idx} display={"inline"}>
          {key} : {(value as number).toExponential(3)}{", "}
        </Box>
      );
    })

    interface StudyType {
      uid: string;
      title: string;
      description: string;
    }
    const createJobStudyCopy = async (job: ProjectFunctionJob) => {
      try {
        const projectJobId = job.projectJobId;
        const inputs = job.inputs
        console.log("inputs: ", inputs)
        const study: StudyType = await fetch(
          PYTHON_DAKOTA_BACKEND + "/flask/clone_job", {
          method: "POST",
          body: JSON.stringify({
            functionName: selectedFunction?.title,
            projectJobId: projectJobId,
            projectInputs: inputs,
          }),
        }).then(function (response) {
          return response.json()
        })
        console.log("Clone study response: ", study)

        if (study && study.uid) {
          return study.uid
        } else {
          toast.error("Failed to open job copy: No UID returned");
        }
      } catch (error) {
        console.error("Error creating Job Copy for inspection:", error);
        toast.error("Error creating Job Copy for inspection");
      }
    }
    return (
      <TableRow
        key={job.job.uid}
        sx={(theme) => ({
          backgroundColor: jobStatus !== 'SUCCESS' ? theme.palette.grey[200] : undefined,
          '& .MuiTableCell-root': {
            color: jobStatus !== 'SUCCESS' ? theme.palette.grey[500] : undefined
          }
        })}
      >
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={job.selected}
            disabled={jobStatus !== "SUCCESS"}
            onChange={(event) => {
              const checked = event.target.checked;
              handleSetJob(checked);
            }}
          />
        </TableCell>
        <TableCell component="th" scope="row" sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} >
          <Tooltip title={job.job.uid} placement="bottom-start">
            <span>{job.job.uid ? job.job.uid.slice(0, 5) + "..." : ""}</span>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <Tooltip title={inputs} placement="bottom-start">
            <span>{inputs}</span>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "auto" }}>
          <Tooltip title={outputs} placement="bottom-start">
            <span>{outputs}</span>
          </Tooltip>
        </TableCell>
        <TableCell align="right">{jobStatus}</TableCell>

        <TableCell align="right" sx={{ gap: "8px" }}>
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={async () => {
                setCreatingJobCopy(true)
                const copy_uid = await createJobStudyCopy(job.job);
                setCreatingJobCopy(false)
                if (copy_uid) openStudyUid(copy_uid)
                else toast.warning("Could not open Job copy in new window!")
              }}
              children={creatingJobCopy ? (
                < >
                  <Box sx={{ display: 'flex' }}>
                    <CircularProgress size={21} />
                  </Box>
                </>
              ) :
                <Typography variant="body2">
                  View
                </Typography>
              }
            >
            </Button>
          </>
        </TableCell>
      </TableRow>
    );
  }
};

export default JobRow;
