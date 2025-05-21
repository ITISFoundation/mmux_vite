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
import { Function, FunctionJob, FunctionJobCollection } from '../osparc-api-ts-client';
import MMUXContext from '../views/MMUXContext';
import { getFunctionJob, getFunctionJobsFromFunctionUid, getFunctionJobCollections } from './function_utils';

// A priori, jobs from a single function (already selected & filtered)
// TODO include tick to select it (and all the completed jobs in the collection)

async function CollectionRow(props: { jobCollection: FunctionJobCollection }) {
    const { jobCollection } = props;
    const jobUidList = jobCollection.jobIds
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
    } else {
        return (
            <React.Fragment>
                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
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
                    <TableCell align="right">{jobCollection.status}</TableCell>
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
    }
}

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
            sx={{ backgroundColor: job.status !== "COMPLETED" ? '#f0f0f0' : 'inherit' }}>
            <TableCell />
            <TableCell component="th" scope="row">
                    {job.uid}
            </TableCell>
            <TableCell align="right">{job.status}</TableCell>
        </TableRow>
    );
}
}

export default function JobsSelector() {
    const [jobCollections, setJobCollections] = React.useState<FunctionJobCollection[]>([]);
    const context = React.useContext(MMUXContext);

    React.useEffect(() => {
        console.log("useEffect in JobsSelector triggered");
        if (context?.selectedFunction === undefined) {
            console.log("No function selected");
            return;
        } else {
            console.log("Function selected: ", context?.selectedFunction?.uid);
            (async () => {
                console.log("Fetching jobCollections for function: ", context?.selectedFunction?.uid);
                const jc = await getFunctionJobCollections(context?.selectedFunction?.uid as string);
                const j = await getFunctionJobsFromFunctionUid(context?.selectedFunction?.uid as string);
                console.log("Fetched jobCollections: ", jc);
                console.log("Fetched jobs: ", j);
                jc.push(...j); // append both lists
                console.log("Combined jobCollections: ", jc);
                // TEMP just jobs, let's see -- This works!! :)
                setJobCollections(j); // append both lists
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
                    {jobCollections.map((item) => {
                        // for now, focus on list of jobs (not job)
                        // TODO include FunctionJobCollection

                        // It's a FunctionJobCollection
                        if ('jobIds' in item) {
                            return <CollectionRow key={(item as FunctionJobCollection).uid} jobCollection={item} />;
                        }
                        // It's a FunctionJob
                        else {
                            return <JobRow key={(item as FunctionJob).uid} jobUid={(item as FunctionJob).uid} />;
                        }
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