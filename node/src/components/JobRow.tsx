import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { Box, Button, Checkbox, CircularProgress, Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import React, { useState } from "react";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";

const JobRow = (props: JobRowProps) => {
  const { jobUid, jobList, setSelected } = props;
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

    const outputs =
      // (job.job.outputs) ?
      (job.job.status === "SUCCESS")
        ? Object.entries(job.job.outputs).map(([key, value], idx) => {
          return (
            <Box key={idx} display={"inline"}>
              {key} : {(value as number).toExponential(3)}{", "}
            </Box>
          );
        })
        : (job.job.status === "STARTED")
          ? [
            <Box key={0} display={"inline"}>
              {"Running..."}
            </Box >
          ]
          : (job.job.status === "FAILED")
            ? "No outputs"
            : (job.job.status === "PENDING") || (job.job.status === "WAITING_FOR_CLUSTER")
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
    const createJobStudyCopy = async (projectJobId: string) => {
      try {
        const study: StudyType = await fetch(
          PYTHON_DAKOTA_BACKEND + "/flask/clone_job", {
          method: "POST",
          body: JSON.stringify({
            projectJobId: projectJobId,
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
      <TableRow key={job.job.uid}>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={job.selected}
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
        <TableCell align="right">{job.job.status}</TableCell>

        <TableCell align="right" sx={{ gap: "8px" }}>
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={async () => {
                setCreatingJobCopy(true)
                const copy_uid = await createJobStudyCopy(job.job.projectJobId);
                setCreatingJobCopy(false)
                console.log("Let's open a new window using project uid: ", copy_uid)
                if (copy_uid) {
                  const url = `/#/study/${copy_uid}`
                  const newWindow = window.open(url);
                  if (newWindow) {
                    console.info("Window opened successfully")
                  } else {
                    toast.warning("Popup blocked! Please allow popups for this site to open the job in a new tab.");
                  }
                } else {
                  toast.warning("Could not open Job copy in new window!")
                }
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
