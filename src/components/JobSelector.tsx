import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import MMUXContext from "../views/MMUXContext";
import { getFunctionJobCollections } from "./function_utils";
import { Checkbox, IconButton } from "@mui/material";
import CollectionRow from "./CollectionRow";
import { Refresh } from "@mui/icons-material";

export default function JobsSelector() {
  const [jobCollections, setJobCollections] = React.useState<
    SelectedJobCollection[]
  >([]);
  const context = React.useContext(MMUXContext);

  const updateJobContext = (jobs: SelectedJobCollection[]) => {
    const newList = jobs
      .map((j) =>
        Object.keys(j.subJobs).reduce((acc: string[], uid: string) => {
          if (j.subJobs[uid] === true) {
            acc.push(uid);
          }
          return acc;
        }, [])
      )
      .flat();
    console.log("Selected jobs for context: ", newList);
    context?.setSelectedJobs(newList);
  };

  const selectMainJob = (index: number, selected: boolean) => {
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(
      (jc, idx) => {
        const auxJob = jc;
        if (idx === index) {
          auxJob.selected = selected;
          auxJob.subJobs = Object.keys(auxJob.subJobs).reduce(
            (acc: { [key: string]: boolean }, jobUid: string) => ({
              ...acc,
              [jobUid]: selected,
            }),
            {}
          );
        }
        return auxJob;
      }
    );

    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  const onSelectJob = (index: number, selected: boolean, subJob: string) => {
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(
      (jc, idx) => {
        const auxJob = jc;
        if (idx === index) {
          auxJob.subJobs[subJob] = selected;
          const subJobState = Object.keys(auxJob.subJobs).map(
            (uid: string) => auxJob.subJobs[uid]
          );
          if (
            subJobState.every((j: boolean) => j === true) ||
            subJobState.every((j: boolean) => j === false)
          ) {
            auxJob.selected = subJobState[0];
          }
        }
        return auxJob;
      }
    );

    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  const onSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    const newJobCollections = jobCollections.map((jc) => ({
      ...jc,
      selected: checked,
      subJobs: jc.jobCollection.jobIds.reduce(
        (acc: { [key: string]: boolean }, jobUid: string) => ({
          ...acc,
          [jobUid]: checked,
        }),
        {}
      ),
    }));

    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  async function updateJobCollections(functionUid: string) {
    console.log("Fetching jobCollections for function: ", functionUid);
    const jc = await getFunctionJobCollections(functionUid as string);
    console.log("Fetched jobCollections: ", jc);
    // NB: all Jobs must belong to a JobCollection (only those will be displayed here)
    const newJobs: SelectedJobCollection[] = jc.map((jc) => ({
      jobCollection: jc,
      selected: false,
      subJobs: jc.jobIds.reduce(
        (acc: { [key: string]: boolean }, jobUid: string) => ({
          ...acc,
          [jobUid]: false,
        }),
        {}
      ),
    }));
    setJobCollections(newJobs);
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
            <TableCell>
              <IconButton
                sx={{
                  padding: "8px",
                  alignSelf: "right",
                  backgroundColor: "#ddd",
                }}
                onClick={async () => {
                  await updateJobCollections(
                    context?.selectedFunction?.uid as string
                  );
                }}
              >
                <Refresh />
              </IconButton>
            </TableCell>
            <TableCell padding="checkbox">
              <Checkbox
                color="primary"
                indeterminate={
                  jobCollections.some((jc) => jc.selected === true) &&
                  jobCollections.some((jc) => jc.selected === false)
                }
                checked={jobCollections.some((jc) => jc.selected === true)}
                onChange={onSelectAllClick}
              />
            </TableCell>
            <TableCell align="right">Job Run</TableCell>
            <TableCell align="right">Status</TableCell>
            <TableCell align="right">N Jobs</TableCell>
            <TableCell align="right">Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobCollections.map((item, idx) => {
            return (
              <CollectionRow
                key={idx}
                job={item}
                selectMainJob={(selected: boolean) =>
                  selectMainJob(idx, selected)
                }
                selectJob={(selected: boolean, subJob: string) =>
                  onSelectJob(idx, selected, subJob)
                }
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
