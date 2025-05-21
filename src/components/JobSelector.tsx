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
import { Checkbox } from "@mui/material";
import CollectionRow from "./CollectionRow";

export default function JobsSelector() {
  const [jobCollections, setJobCollections] = React.useState<SelectedJobCollection[]>([]);
  const context = React.useContext(MMUXContext);

  const onSelectJob = (index: number, selected: boolean) => {
    setJobCollections(jobCollections.map((jc, idx) => {
      if (idx === index) {
        return {
          ...jc,
          selected,
        };
      }
      return jc;
    }));
  }

  const onSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    const newJobCollections = jobCollections.map((jc) => ({
      ...jc,
      selected: checked,
    }));
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
            <TableCell padding="checkbox">
              <Checkbox
                color="primary"
                indeterminate={jobCollections.some((jc) => jc.selected) && jobCollections.some((jc) => !jc.selected)}
                checked={!jobCollections.find((jc) => jc.selected === false)}
                onChange={onSelectAllClick}
              />
            </TableCell>
            <TableCell>Job Run</TableCell>
            <TableCell align="right">Status</TableCell>
            <TableCell align="right">N Jobs</TableCell>
            <TableCell align="right">Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobCollections.map((item, idx) => {
            return <CollectionRow key={idx} jobs={item} selectJob={(selected: boolean)=>onSelectJob(idx, selected)}/>;
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}