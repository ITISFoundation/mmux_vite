import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { Box, Button, Checkbox, CircularProgress, Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import { useState } from "react";
import { openStudyUid, createJobStudyCopy } from "../../utils/function_utils";
import { Function as OsparcFunction } from "osparc-api-ts-client";

interface JobRowProps {
  jobUid: string;
  setSelected: (selected: boolean, subJob: string) => void;
  jobList: SubJob[];
  selectedFunction?: OsparcFunction;
}

function JobRow(props: JobRowProps) {
  const { jobUid, jobList, setSelected, selectedFunction } = props;
  const job = jobList.find(j => j.job.uid === jobUid);
  const [creatingJobCopy, setCreatingJobCopy] = useState(false);

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
  }
  const jobStatus = job.job.status;
  let outputs;
  if (jobStatus === "SUCCESS") {
    outputs = Object.entries(job.job.outputs).map(([key, value]) => (
      <Box key={`job-row-output-${key}`} display="inline">
        {key} : {(value as number).toExponential(3)}
        {", "}
      </Box>
    ));
  } else if (jobStatus === "STARTED") {
    outputs = [
      <Box key={0} display="inline">
        Running...
      </Box>,
    ];
  } else if (jobStatus === "FAILED" || jobStatus === "ABORTED") {
    outputs = "Failed - no outputs";
  } else if (
    jobStatus === "PENDING" ||
    jobStatus === "WAITING_FOR_CLUSTER" ||
    jobStatus === "PUBLISHED" ||
    jobStatus === "NOT_STARTED" ||
    jobStatus === "WAITING_FOR_RESOURCES" // all are valid options
  ) {
    outputs = "Pending to run";
  } else if (jobStatus === "UNKNOWN") {
    outputs = "Please try again later";
  } else {
    outputs = "Unknown status, please contact support";
  }

  const inputs = Object.entries(job.job.inputs).map(([key, value]) => (
    <Box key={`job-row-input-${key}`} display="inline">
      {key} : {(value as number).toExponential(3)}
      {", "}
    </Box>
  ));

  return (
    <TableRow
      key={job.job.uid}
      sx={theme => ({
        backgroundColor: jobStatus !== "SUCCESS" ? theme.palette.grey[200] : undefined,
        "& .MuiTableCell-root": {
          color: jobStatus !== "SUCCESS" ? theme.palette.grey[500] : undefined,
        },
      })}
    >
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={job.selected}
          disabled={jobStatus !== "SUCCESS"}
          onChange={event => {
            const { checked } = event.target;
            handleSetJob(checked);
          }}
        />
      </TableCell>
      <TableCell
        component="th"
        scope="row"
        sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        <Tooltip title={job.job.uid} placement="bottom-start">
          <span>{job.job.uid ? `${job.job.uid.slice(0, 5)}...` : ""}</span>
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
              setCreatingJobCopy(true);
              const copyUID = (await createJobStudyCopy(selectedFunction?.title as string, job.job)) as string;
              setCreatingJobCopy(false);
              if (copyUID) openStudyUid(copyUID);
              else toast.warning("Could not open Job copy in new window!");
            }}
          >
            {creatingJobCopy ? (
              <Box sx={{ display: "flex" }}>
                <CircularProgress size={21} />
              </Box>
            ) : (
              <Typography variant="body2">View</Typography>
            )}
          </Button>
        </>
      </TableCell>
    </TableRow>
  );
}

export default JobRow;
