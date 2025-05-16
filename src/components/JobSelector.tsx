import * as React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Function, FunctionJob, FunctionJobCollection } from '../functions-api-ts-client';
import { JOB_API } from './api_objects';
import MMUXContext from '../views/MMUXContext';

// A priori, jobs from a single function (already selected & filtered)
// TODO include tick to select it (and all the completed jobs in the collection)
// TODO fix -- only for JobCOllections -- retrieve jobs from the collection (or do in main table?)
// async function CollectionRow(props: { jobCollection: FunctionJobCollection }) {
//     const { jobCollection } = props;
//     const [open, setOpen] = React.useState(false);

//     if (jobList.length === 0) {
//         return (
//             <TableRow>
//                 <TableCell colSpan={6}>
//                     <Typography variant="h6" gutterBottom component="div">
//                         No jobs found for this function.
//                     </Typography>
//                 </TableCell>
//             </TableRow>
//         );

//     } else {
//         return (
//             <React.Fragment>
//                 <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
//                     <TableCell>
//                         <IconButton
//                             aria-label="expand row"
//                             size="small"
//                             onClick={() => setOpen(!open)}
//                         >
//                             {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
//                         </IconButton>
//                     </TableCell>
//                     <TableCell component="th" scope="row">
//                         {jobCollection.name}
//                     </TableCell>
//                     <TableCell align="right">{jobCollection.status}</TableCell>
//                     <TableCell align="right">{jobCollection.jobIds.length}</TableCell>
//                 </TableRow>
//                 <TableRow>
//                     <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
//                         <Collapse in={open} timeout="auto" unmountOnExit>
//                             <Box sx={{ margin: 1 }}>
//                                 <Typography variant="h6" gutterBottom component="div">
//                                     Jobs
//                                 </Typography>
//                                 <Table size="small" aria-label="jobs">
//                                     <TableHead>
//                                         <TableRow>
//                                             <TableCell />
//                                             <TableCell>Job ID</TableCell>
//                                             <TableCell align="right">Status</TableCell>
//                                         </TableRow>
//                                     </TableHead>
//                                     <TableBody>
//                                         {jobList.map((job) => (
//                                             <JobRow key={job.id} job={job} />
//                                         ))}
//                                     </TableBody>
//                                 </Table>
//                             </Box>
//                         </Collapse>
//                     </TableCell>
//                 </TableRow>
//             </React.Fragment>
//         );
//     }
// }
// TODO include tick to select it
function JobRow(props: { job: FunctionJob }) {
    const { job } = props;
    return (
        <TableRow
            key={job.id}
            sx={{ backgroundColor: job.status !== "COMPLETED" ? '#f0f0f0' : 'inherit' }}>
            <TableCell />
            <TableCell component="th" scope="row">
                {job.id}
            </TableCell>
            <TableCell align="right">{job.status}</TableCell>
        </TableRow>
    );
}

export default function JobsSelector() {
    const [jobList, setJobList] = React.useState<FunctionJob[]>([]);
    const context = React.useContext(MMUXContext);

    React.useEffect(() => {
        console.log("useEffect in JobsSelector triggered");
        if (context?.selectedFunction === undefined) {
            console.log("No function selected");
            return;
        } else {
            console.log("Function selected: ", context?.selectedFunction?.id);
            (async () => {
                console.log("Fetching jobs for function: ", context?.selectedFunction?.id);
                const jobs = await JOB_API.getFunctionJobs(context?.selectedFunction?.id as number);
                console.log("Jobs: ", jobs);
                setJobList(jobs);
            })();
        }
    }, [context?.selectedFunction]);

    return (
        <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                    <TableRow>
                        <TableCell />
                        {/* <TableCell>Campaign</TableCell> */}
                        <TableCell>Job</TableCell>
                        <TableCell align="right">Status</TableCell>
                        {/* <TableCell align="right">N Jobs</TableCell> */}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {jobList.map((item) => {
                        // for now, focus on list of jobs (not job)
                        // TODO include FunctionJobCollection

                        // // It's a FunctionJobCollection
                        // if ('jobIds' in item) {
                        //     return <CollectionRow key={item.name} jobCollection={item} />;
                        // }
                        // // It's a FunctionJob
                        // else {
                        return <JobRow job={item} />;
                        // }
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