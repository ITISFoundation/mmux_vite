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
import { Checkbox } from "@mui/material";
import JobRow from "./JobRow";

// A priori, jobs from a single function (already selected & filtered)
// TODO include tick to select it (and all the completed jobs in the collection)
const CollectionRow = (props: CollectionRowProps) => {
  const { job, selectMainJob, selectJob } = props;
  const [open, setOpen] = React.useState(false);
  const jobData = job.jobCollection;
  const subJobs = job.subJobs;


  if (Object.keys(subJobs).length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Typography variant="h6" gutterBottom component="div">
            No jobs in Job Campaign {jobData.title}.
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
            checked={job.selected}
            indeterminate={Object.keys(job.subJobs).some((id) => job.subJobs[id] === true) && Object.keys(job.subJobs).some((id) => job.subJobs[id] === false)}
            onChange={(event) => {
              const checked = event.target.checked;
              selectMainJob(checked);
            }}
          />
        </TableCell>
        <TableCell component="th" scope="row" align="right">
          {jobData.title}
        </TableCell>
        {/* <TableCell align="right">{jobCollection.status}</TableCell> */}
        <TableCell align="right"> TODO </TableCell>
        <TableCell align="right">{jobData.jobIds?.length}</TableCell>
        <TableCell align="right"> TODO </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ marginLeft: 12 }}>
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
                  {jobData.jobIds?.map((jobUid: string) => (
                    <JobRow key={jobUid} jobUid={jobUid} jobList={subJobs} setSelected={(selected: boolean) => selectJob(selected, jobUid)} />
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
