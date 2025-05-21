import * as React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { FunctionJob, FunctionJobCollection } from "../osparc-api-ts-client";
import MMUXContext from "../views/MMUXContext";
import { getFunctionJob, getFunctionJobCollections } from "./function_utils";

interface CollectionRowProps {
  jobCollection: FunctionJobCollection;
}

// A priori, jobs from a single function (already selected & filtered)
// TODO include tick to select it (and all the completed jobs in the collection)
const CollectionRow = (props: CollectionRowProps) => {
  const { jobCollection } = props;
  const jobUidList = jobCollection.jobIds;
  const [open, setOpen] = React.useState(false);

  if (jobUidList?.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Typography variant="h6" gutterBottom component="div">
            No jobs in JobCollection {jobCollection.title}.
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
        <TableCell component="th" scope="row">
          {jobCollection.title}
        </TableCell>
        {/* <TableCell align="right">{jobCollection.status}</TableCell> */}
        <TableCell align="right">{jobCollection.jobIds?.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Jobs
              </Typography>
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
                  {jobUidList?.map((jobUid) => (
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

// TODO include tick to select it
function JobRow(props: { jobUid: string }) {
  const { jobUid } = props;
  const [job, setJob] = React.useState<FunctionJob | null>(null);

  React.useEffect(() => {
    (async () => {
      const j = await getFunctionJob(jobUid);
      setJob(j);
    })();
  }, [jobUid]);

  if (job === null) {
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
        <TableCell />
        <TableCell component="th" scope="row">
          {job.uid ? job.uid.slice(0, 5) : ""}...
        </TableCell>
        <TableCell>{job.inputs}</TableCell>
        <TableCell>{job.outputs}</TableCell>
        <TableCell align="right">{job.status}</TableCell>
      </TableRow>
    );
  }
}

export default function JobsSelector() {
  const [jobCollections, setJobCollections] = React.useState<
    FunctionJobCollection[]
  >([]);
  const context = React.useContext(MMUXContext);

  async function updateJobCollections(functionUid: string) {
    console.log("Fetching jobCollections for function: ", functionUid);
    const jc = await getFunctionJobCollections(functionUid as string);
    console.log("Fetched jobCollections: ", jc);
    // NB: all Jobs must belong to a JobCollection (only those will be displayed here)
    setJobCollections(jc);
  }
  React.useEffect(() => {
    console.log("useEffect in JobsSelector triggered");
    if (context?.selectedFunction === undefined) {
      console.log("No function selected");
      return;
    } else {
      console.log("Function selected: ", context?.selectedFunction?.uid);
      (async () => {
        await updateJobCollections(context?.selectedFunction?.uid as string);
        console.log("Updated JobCollections");
      })();
    }
  }, [context?.selectedFunction]);
  // TODO include button to "refresh" job collections using the function above

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            {/* <TableCell>Campaign</TableCell> */}
            <TableCell>Job Run</TableCell>
            <TableCell align="right">Status</TableCell>
            <TableCell align="right">N Jobs</TableCell>
            <TableCell align="right">Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobCollections.map((item, idx) => {
            return <CollectionRow key={idx} jobCollection={item} />;
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
// function JobSelector() {
//     return (
//         <div>
//             <h1>Job Selector</h1>
//             <p>Select a job to view details.</p>
//         </div>
//     );
// }
// export default JobSelector;
