import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { Box, Button, Checkbox, Tooltip } from "@mui/material";
import React from "react";

// TODO include tick to select it
const JobRow = (props: JobRowProps) => {
  const { jobUid, jobList, setSelected } = props;
  const job = jobList.find(j => j.job.uid === jobUid);

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
            : (job.job.status === "Pending")
              ? "Pending to run"
              : "Unknown status, please contact support"

    const inputs = Object.entries(job.job.inputs).map(([key, value], idx) => {
      return (
        <Box key={idx} display={"inline"}>
          {key} : {(value as number).toExponential(3)}{", "}
        </Box>
      );
    })


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
          <Tooltip title={job.job.uid}>
            {job.job.uid ? job.job.uid.slice(0, 5) : ""}...
          </Tooltip>
        </TableCell>
        <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <Tooltip title={inputs}>
            {inputs}
          </Tooltip>
        </TableCell>
        <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "auto" }}>
          <Tooltip title={outputs}>
            {outputs}
          </Tooltip>
        </TableCell>

        {/* TODO this opens the original job - replace by creating a copy!! */}
        <TableCell align="right" sx={{ gap: "8px" }}>
          <Button
            variant="outlined"
            size="small"
            href={`/#/study/${job.job.projectJobId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View
          </Button>
        </TableCell>
        <TableCell align="right">{job.job.status}</TableCell>
      </TableRow>
    );
  }
};

export default JobRow;
