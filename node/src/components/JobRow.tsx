import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { Box, Checkbox } from "@mui/material";

// TODO include tick to select it
const JobRow = (props: JobRowProps) => {
  const { jobUid, jobList, setSelected } = props;
  const job = jobList.find(j => j.job.uid === jobUid);

  const handleSetJob = (selected: boolean) => {
    setSelected(selected, jobUid);
  };

  if (job === undefined) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Typography variant="body1" gutterBottom component="div">
            Loading job {jobUid}...
          </Typography>
        </TableCell>
      </TableRow>
    );
  } else {
    return (
      <TableRow key={job.job.uid}>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={job.selected}
            onChange={(event) => {
              const checked = event.target.checked;
              handleSetJob(checked);
            }}
          />
        </TableCell>
        <TableCell component="th" scope="row">
          {job.job.uid ? job.job.uid.slice(0, 5) : ""}...
        </TableCell>
        <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {Object.entries(job.job.inputs).map(([key, value], idx) => {
            return (
              <Box key={idx} display={"inline"}>
                {key} : {(value as number).toExponential(3)}{", "}
              </Box>
            );
          })}
        </TableCell>
        <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {(job.job.outputs && job.job.status === "SUCCESS") ? Object.entries(job.job.outputs).map(([key, value], idx) => {
            return (
              <Box key={idx} display={"inline"}>
                {key} : {(value as number).toExponential(3)}{", "}
              </Box>
            );
          }) : "No outputs"}
        </TableCell>
        <TableCell align="right">{job.job.status}</TableCell>
      </TableRow>
    );
  }
};

export default JobRow;
