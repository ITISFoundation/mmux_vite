import * as React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { getFunctionJob } from "./function_utils";
import { FunctionJob } from "../osparc-api-ts-client";
import { Checkbox } from "@mui/material";

type SelectedFunctionJob = FunctionJob & {
  selected: boolean;
};

// TODO include tick to select it
const JobRow = (props: { jobUid: string }) => {
  const { jobUid } = props;
  const [job, setJob] = React.useState<SelectedFunctionJob | undefined>(
    undefined
  );

  React.useEffect(() => {
    (async () => {
      const job = await getFunctionJob(jobUid);
      setJob({ ...job, selected: false });
    })();
  }, [jobUid]);

  console.log("JobRow: ", jobUid, job);
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
            checked={job.selected}
            onChange={(event) => {
              const checked = event.target.checked;
              setJob({ ...job, selected: checked });
            }}
          />
        </TableCell>
        <TableCell component="th" scope="row">
          {job.uid ? job.uid.slice(0, 5) : ""}...
        </TableCell>
        <TableCell>
          {Object.entries(job.inputs).map(([key, value], idx) => {
            return (
              <div key={idx}>
                {key} : {(value as number).toString()}
              </div>
            );
          })}
        </TableCell>
        <TableCell>
          {Object.entries(job.outputs).map(([key, value], idx) => {
            return (
              <div key={idx}>
                {key} : {(value as number).toString()}
              </div>
            );
          })}
        </TableCell>
        {/* <TableCell> TODO </TableCell>
        <TableCell> TODO </TableCell> */}
        <TableCell align="right">{job.status}</TableCell>
      </TableRow>
    );
  }
}

export default JobRow;