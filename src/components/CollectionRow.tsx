import * as React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { getFunctionJob } from "./function_utils";
import { FunctionJob } from "../osparc-api-ts-client";
import { Checkbox } from "@mui/material";

type SelectedFunctionJob = FunctionJob & {
  selected: boolean;
};

type CollectionRowProps = {
  jobs: SelectedJobCollection;
  selectJob: (selected: boolean) => void;
};

// TODO include tick to select it
function JobRow(props: { jobUid: string }) {
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

// A priori, jobs from a single function (already selected & filtered)
// TODO include tick to select it (and all the completed jobs in the collection)
const CollectionRow = (props: CollectionRowProps) => {
  const { jobs, selectJob } = props;
  const jobCol = jobs.jobCollection;
  const [open, setOpen] = React.useState(false);

  if (jobCol.jobIds?.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Typography variant="h6" gutterBottom component="div">
            No jobs in Job Campaign {jobCol.title}.
          </Typography>
        </TableCell>
      </TableRow>
    );
  }
  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={jobs.selected}
            onChange={(event) => {
              const checked = event.target.checked;
              selectJob(checked);
            }}
          />
        </TableCell>
        <TableCell component="th" scope="row">
          {jobCol.title}
        </TableCell>
        {/* <TableCell align="right">{jobCollection.status}</TableCell> */}
        <TableCell align="right"> TODO </TableCell>
        <TableCell align="right">{jobCol.jobIds?.length}</TableCell>
        <TableCell align="right"> TODO </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Table size="small" aria-label="jobs">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Job ID</TableCell>
                    <TableCell>Inputs</TableCell>
                    <TableCell>Outputs</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobCol.jobIds?.map((jobUid: string) => (
                    <JobRow key={jobUid} jobUid={jobUid} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default CollectionRow;
