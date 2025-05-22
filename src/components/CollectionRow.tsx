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
  const { jobs, allSelected, selectJob } = props;
  const [open, setOpen] = React.useState(false);
  const jobCol = jobs.jobCollection;
  const [jobIds, setJobIds] = React.useState<{[key: string]: boolean}>(jobCol.jobIds.reduce((acc:{[key: string]: boolean}, jobUid: string) => ({
    ...acc,
    [jobUid]: allSelected,
  }), { }));

  const handleJobSelection = (jobUid: string, selected: boolean) => {
    jobIds[jobUid] = selected;
    setJobIds(jobIds);


    if(Object.keys(jobIds).every((id) => jobIds[id] === true)) {
      selectJob(true);
    } else {
      selectJob(false);
    }
  };

  React.useEffect(() => {
    if(Object.keys(jobIds).every((uid: string) => jobIds[uid] === true) || Object.keys(jobIds).every((uid: string) => jobIds[uid] === false)){
      setJobIds(jobCol.jobIds.reduce((acc:{[key: string]: boolean}, jobUid: string) => ({
        ...acc,
        [jobUid]: allSelected,
      }), { }));
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [allSelected]);

  if (Object.keys(jobIds).length === 0) {
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
        <TableCell component="th" scope="row" align="right">
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
                  {jobCol.jobIds?.map((jobUid: string) => (
                    <JobRow key={jobUid} jobUid={jobUid} jobList={jobIds} setSelected={(selected: boolean) => handleJobSelection(jobUid, selected)} />
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
