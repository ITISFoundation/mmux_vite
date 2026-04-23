import { Box, Button, Checkbox, CircularProgress } from "@mui/material";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "react-toastify";
import { Function as OsparcFunction } from "../../osparc-api-ts-client";
import { createJobStudyCopy, openStudyUid } from "../../utils/functionUtils";
import CustomTooltip from "../utils/CustomTooltip";
import { useJobContext } from "../../context/JobContext";

interface JobRowProps {
  jobUid: string;
  setSelected: (selected: boolean, subJob: string) => void;
  jobList: SubJob[];
  selectedFunction?: OsparcFunction;
}

function JobRow(props: JobRowProps) {
  const { jobUid, jobList, setSelected, selectedFunction } = props;
  const [creatingJobCopy, setCreatingJobCopy] = useState(false);
  const { parseStatus } = useJobContext();
  const job = jobList.find(j => j.job.uid === jobUid);

  const handleSetJob = (selected: boolean) => {
    setSelected(selected, jobUid);
  };

  if (job === undefined) {
    return (
      <TableRow
        key={jobUid}
        sx={theme => ({
          backgroundColor: theme.palette.grey[200],
          "& .MuiTableCell-root": {
            color: theme.palette.grey[500],
          },
        })}
      >
        <TableCell padding="checkbox">
          <Checkbox color="primary" checked={false} disabled />
        </TableCell>
        <TableCell
          component="th"
          scope="row"
          sx={{ minWidth: 100, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          <CustomTooltip title={jobUid} placement="bottom-start">
            <span>{jobUid ? `${jobUid.slice(0, 5)}...` : ""}</span>
          </CustomTooltip>
        </TableCell>
        <TableCell sx={{ minWidth: 250, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <CustomTooltip title="" placement="bottom-start">
            <span />
          </CustomTooltip>
        </TableCell>
        <TableCell
          sx={{
            minWidth: 250,
            maxWidth: 250,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: "auto",
          }}
        >
          <CustomTooltip title="" placement="bottom-start">
            <span />
          </CustomTooltip>
        </TableCell>
        <TableCell
          align="right"
          sx={{ minWidth: 120, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          <CustomTooltip title="CREATING" placement="bottom-start">
            <span>CREATING</span>
          </CustomTooltip>
        </TableCell>

        <TableCell align="right" sx={{ gap: "8px" }}>
          <>
            <Button variant="outlined" size="small" disabled>
              {creatingJobCopy ? (
                <Box sx={{ display: "flex" }}>
                  <CircularProgress size={21} />
                </Box>
              ) : (
                <Typography variant="body2">View</Typography>
              )}
            </Button>
          </>
        </TableCell>
      </TableRow>
    );
  }

  const jobStatus = job.job.status;
  const outputs = parseStatus(jobStatus, job.job.outputs);

  const inputs = Object.entries(job.job.inputs).map(([key, value]) => (
    <Box key={`job-row-input-${key}`} display="inline">
      {key} : {(value as number).toPrecision(3)}
      {", "}
    </Box>
  ));

  return (
    <TableRow
      key={job.job.uid}
      sx={theme => ({
        backgroundColor: jobStatus !== "SUCCESS" ? theme.palette.grey[200] : undefined,
        "& .MuiTableCell-root": {
          color: jobStatus !== "SUCCESS" ? theme.palette.grey[500] : undefined,
        },
      })}
    >
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={job.selected}
          disabled={jobStatus !== "SUCCESS"}
          onChange={event => {
            const { checked } = event.target;
            handleSetJob(checked);
          }}
        />
      </TableCell>
      <TableCell
        component="th"
        scope="row"
        sx={{ minWidth: 100, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        <CustomTooltip border title={job.job.uid} placement="bottom-start">
          <span>{job.job.uid ? `${job.job.uid.slice(0, 5)}...` : ""}</span>
        </CustomTooltip>
      </TableCell>
      <TableCell sx={{ minWidth: 250, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        <CustomTooltip border title={inputs} placement="bottom-start">
          <span>{inputs}</span>
        </CustomTooltip>
      </TableCell>
      <TableCell
        sx={{ minWidth: 250, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "auto" }}
      >
        <CustomTooltip border title={outputs} placement="bottom-start">
          <span>{outputs}</span>
        </CustomTooltip>
      </TableCell>
      <TableCell
        align="right"
        sx={{ minWidth: 120, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        <CustomTooltip border title={jobStatus} placement="bottom-start">
          <span>{jobStatus}</span>
        </CustomTooltip>
      </TableCell>

      <TableCell align="right" sx={{ gap: "8px" }}>
        <>
          <Button
            variant="outlined"
            size="small"
            disabled={
              creatingJobCopy ||
              (!jobStatus.includes("SUCCESS") && !(jobStatus.includes("FAILED") || jobStatus.includes("FAILURE")))
            }
            onClick={async () => {
              setCreatingJobCopy(true);
              const copyUID = (await createJobStudyCopy(selectedFunction?.title as string, job.job)) as string;
              setCreatingJobCopy(false);
              if (copyUID) openStudyUid(copyUID);
              else toast.warning("Could not open Job copy in new window!");
            }}
          >
            {creatingJobCopy ? (
              <Box sx={{ display: "flex" }}>
                <CircularProgress size={21} />
              </Box>
            ) : (
              <Typography variant="body2">View</Typography>
            )}
          </Button>
        </>
      </TableCell>
    </TableRow>
  );
}

export default JobRow;
