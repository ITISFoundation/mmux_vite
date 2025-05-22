import * as React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { getFunctionJob } from "./function_utils";
import { FunctionJob } from "../osparc-api-ts-client";
import { Box, Checkbox } from "@mui/material";

// TODO include tick to select it
const JobRow = (props: JobRowProps) => {
  const { jobUid, jobList, setSelected } = props;
  const [job, setJob] = React.useState<FunctionJob | undefined>(undefined);

  const handleSetJob = (selected: boolean) => {
    setSelected(selected);
  };

  React.useEffect(() => {
    (async () => {
      const job = await getFunctionJob(jobUid);
      setJob(job);
    })();
  }, [jobUid]);

  if (job === undefined) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Typography variant="h6" gutterBottom component="div">
            Loading job {jobUid}...
          </Typography>
        </TableCell>
      </TableRow>
    );
  } else {
    return (
      <TableRow
        key={job.uid}
        sx={{
          backgroundColor: job.status !== "COMPLETED" ? "#f0f0f0" : "inherit",
        }}
      >
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={jobList[job.uid] ? jobList[job.uid] : false}
            onChange={(event) => {
              const checked = event.target.checked;
              handleSetJob(checked);
            }}
          />
        </TableCell>
        <TableCell component="th" scope="row">
          {job.uid ? job.uid.slice(0, 5) : ""}...
        </TableCell>
        <TableCell>
          {Object.entries(job.inputs).map(([key, value], idx) => {
            return (
              <Box key={idx} display={"inline"}>
                {key} : {(value as number).toString()}{" "}
              </Box>
            );
          })}
        </TableCell>
        <TableCell>
          {Object.entries(job.outputs).map(([key, value], idx) => {
            return (
              <Box key={idx} display={"inline"}>
                {key} : {(value as number).toString()}
              </Box>
            );
          })}
        </TableCell>
        <TableCell align="right">{job.status}</TableCell>
      </TableRow>
    );
  }
};

export default JobRow;
