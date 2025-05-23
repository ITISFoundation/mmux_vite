import { useState, useEffect, useCallback, useContext } from 'react'
import type { FunctionJob } from '../osparc-api-ts-client';
import MMUXContext from './MMUXContext';
import { getFunctionJobsFromFunctionUid } from '../components/function_utils';

const statusColors = {
    PENDING: 'bg-gray-300',
    RUNNING: 'bg-blue-700',
    COMPLETED: 'bg-green-700',
    FAILED: 'bg-red-700'
};

type StatusIconProps = {
    status: string;
}
// "RunningState": {
// "type": "string", "enum": ["UNKNOWN", "PUBLISHED", "NOT_STARTED", "PENDING", "WAITING_FOR_RESOURCES", "STARTED", "SUCCESS", "FAILED", "ABORTED", "WAITING_FOR_CLUSTER"]
type jobsByStatusType = {
    PENDING: Record<string, FunctionJob>;
    RUNNING: Record<string, FunctionJob>;
    COMPLETED: Record<string, FunctionJob>;
    FAILED: Record<string, FunctionJob>;
};

const StatusIcon = (props: StatusIconProps) => {
    const status: string = props.status
    switch (status) {
        case 'PENDING':
            return (
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
            );
        case 'RUNNING':
            return (
                <svg className="w-6 h-6 text-blue-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            );
        case 'COMPLETED':
            return (
                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        case 'FAILED':
            return (
                <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        default:
            return null;
    }
};

const formatDuration = (seconds: number) => {
    if (seconds === null) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

type ProgressBarProps = {
    jobsByStatus: jobsByStatusType;
    totalETA?: number;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ jobsByStatus, totalETA = 0 }) => {
    const total: number = Object.values(jobsByStatus).reduce((acc, jobs) => acc + Object.keys(jobs).length, 0);
    const widths = {
        COMPLETED: (Object.keys(jobsByStatus.COMPLETED).length / total) * 100,
        RUNNING: (Object.keys(jobsByStatus.RUNNING).length / total) * 100,
        PENDING: (Object.keys(jobsByStatus.PENDING).length / total) * 100,
        FAILED: (Object.keys(jobsByStatus.FAILED).length / total) * 100
    };

    return (
        <div className="w-full mb-4">
            <div className="h-8 flex mb-2">
                {(['COMPLETED', 'RUNNING', 'PENDING', 'FAILED'] as Array<keyof typeof widths>).map((status) => (
                    <div
                        key={status}
                        className={`${statusColors[status]} relative overflow-hidden`}
                        style={{ width: `${widths[status]}%` }}
                    >
                        {status === 'RUNNING' && (
                            <div className="absolute inset-0 opacity-50">
                                <div className="animate-progress-mac w-full h-full bg-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="text-sm text-gray-300">
                <span>Estimated Time Remaining: {formatDuration(totalETA)}</span>
            </div>
        </div>
    );
};

type JobCardProps = {
    job: FunctionJob;
};
function JobCard(props: JobCardProps) {
    const job = props.job
    if (!job) {
        return (
            <span>
                JobCard could not be rendered
            </span>
        )
    }
    else {
        const jobtitle = job.uid?.toString() + ": " + JSON.stringify(job.inputs)
        return (
            <div className="relative mb-2 group">
                <div className={`p-3 rounded shadow ${statusColors[job.status]} transition-all duration-300 ease-in-out`}>
                    <div className="flex justify-between items-center">
                        <h3 className={`font-bold ${job.status === 'PENDING' ? 'text-gray-800' : 'text-white'} truncate`}>{jobtitle}</h3>
                        <StatusIcon status={job.status} />
                    </div>
                    {job.status === 'RUNNING' && (
                        <div className="mt-2 text-sm text-white">
                            {/* <p>Running Time: {formatDuration(job.RUNNINGTime)}</p>
                            <p>ETA: {formatDuration(job.eta)}</p> */}
                        </div>
                    )}
                    {job.status === 'COMPLETED' && (
                        <div className="mt-2 text-sm text-white">
                            {/* <p>Completed in: {formatDuration(job.completionTime)}</p> */}
                        </div>
                    )}
                </div>
                <div className={`absolute top-0 left-0 w-full p-3 rounded shadow ${statusColors[job.status]} opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-10`}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className={`font-bold ${job.status === 'PENDING' ? 'text-gray-800' : 'text-white'}`}>{jobtitle}</h3>
                        <StatusIcon status={job.status} />
                    </div>
                    <p className={job.status === 'PENDING' ? 'text-gray-700' : 'text-gray-300'}>{jobtitle}</p>
                    {job.status === 'RUNNING' && (
                        <div className="mt-2 text-sm text-white">
                            {/* <p>Running Time: {formatDuration(job.RUNNINGTime)}</p>
                            <p>ETA: {formatDuration(job.eta)}</p> */}
                        </div>
                    )}
                    {job.status === 'COMPLETED' && (
                        <div className="mt-2 text-sm text-white">
                            {/* <p>Completed in: {formatDuration(job.completionTime)}</p> */}
                        </div>
                    )}
                </div>
            </div>
        )
    }
};

type StatusColumnProps = {
    title: string;
    jobs: Record<string, FunctionJob>;
}
function StatusColumn(props: StatusColumnProps) {
    const { title, jobs } = props;
    return (
        <div className="flex-1 flex flex-col h-full p-4 overflow-hidden border-r border-gray-700">
            <h2 className="text-xl font-bold mb-2 text-gray-200">{title}</h2>
            <p className="text-sm text-gray-400 mb-4">Jobs: {Object.keys(jobs).length}</p>
            <div className="flex-1 overflow-y-auto pr-2">
                {Object.entries(jobs).map(([id, job]) => (
                    <JobCard key={id} job={job} />
                ))}
            </div>
        </div>
    );
}

interface JobDashboardProps {
    progressBarOnly?: boolean;
}
export function Dashboard(props: JobDashboardProps) {
    const { progressBarOnly } = props;
    const [jobs, setJobs] = useState<FunctionJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // const [totalETA, setTotalETA] = useState(null);
    const context = useContext(MMUXContext);


    const fetchJobs = useCallback(async () => {
        try {
            let jobList = await getFunctionJobsFromFunctionUid(context?.selectedFunction?.uid as string);
            console.log("Fetched jobs:", jobList);
            setJobs(jobList);
            // setTotalETA(data.totalETA);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch jobs:", e);
            setError("Failed to load jobs. Please try again later.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
        const intervalId = setInterval(fetchJobs, 5000); // Refresh every 5 seconds
        return () => clearInterval(intervalId);
    }, [fetchJobs]);

    const classifyJobStatus = (job_status: string) => {
        switch (job_status) {
            case 'UNKNOWN':
                return undefined
            case 'PUBLISHED':
                return "PENDING"
            case 'NOT_STARTED':
                return "PENDING"
            case 'PENDING':
                return "PENDING"
            case 'WAITING_FOR_RESOURCES':
                return "PENDING"
            case 'STARTED':
                return "RUNNING"
            case 'SUCCESS':
                return "COMPLETED"
            case 'FAILED':
                return "FAILED"
            case 'ABORTED':
                return "FAILED"
            case 'WAITING_FOR_CLUSTER':
                return "PENDING"
            default:
                return undefined;
        }

    }


    const jobsByStatus: jobsByStatusType = Object.entries(jobs).reduce((acc: jobsByStatusType, [id, job]) => {
        if (job.status) {
            const s = classifyJobStatus(job.status)
            if (s !== undefined) {
                if (!acc[s]) acc[s] = {};
                acc[s][id] = job;
            }
            return acc;
        }
        else {
            console.error("Job has no status:", job);
            return acc;
        }
    }, { PENDING: {}, RUNNING: {}, COMPLETED: {}, FAILED: {} });

    if (loading) {
        return <div className="flex h-screen bg-gray-900 text-white items-center justify-center">Loading...</div>;
    }

    if (error) {
        <ProgressBar jobsByStatus={jobsByStatus} />
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <ProgressBar jobsByStatus={jobsByStatus} /> {/* totalETA={totalETA} /> */}
            {!progressBarOnly && (
                <div className="flex-1 flex flex-row overflow-hidden">
                    <StatusColumn title="Pending" jobs={jobsByStatus.PENDING} />
                    <StatusColumn title="Running" jobs={jobsByStatus.RUNNING} />
                    <StatusColumn title="Done" jobs={jobsByStatus.COMPLETED} />
                    <StatusColumn title="Failed" jobs={jobsByStatus.FAILED} />
                </div>
            )}
        </div>
    );
};

export default Dashboard;