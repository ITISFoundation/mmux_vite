import React, { useEffect, useState } from "react";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import MMUXContext from "../views/MMUXContext";
import { getFunctionJobCollections } from "../utils/function_utils";
import {
  Box,
  Card,
  Checkbox,
  IconButton,
  Popper,
  Typography,
} from "@mui/material";
import CollectionRow from "./CollectionRow";
import { Refresh } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import JobRow from "./JobRow";

export default function JobsSelector() {
  const [jobCollections, setJobCollections] = useState<SelectedJobCollection[]>(
    []
  );
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const [poperID, setPopperID] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(true);
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

  const selectMainJob = (uid: string, selected: boolean) => {
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(
      (jc) => {
        const auxJob = jc;
        if (jc.jobCollection.uid === uid) {
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
      subJobs: jc.jobCollection.jobIds
        ? jc.jobCollection.jobIds.reduce(
            (acc: { [key: string]: boolean }, jobUid: string) => ({
              ...acc,
              [jobUid]: checked,
            }),
            {}
          )
        : {},
    }));

    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  async function updateJobCollections(functionUid: string) {
    console.log("Fetching jobCollections for function: ", functionUid);
    const jc = (await getFunctionJobCollections(
      functionUid as string
    )) as FunctionJobCollection[];
    console.log("Fetched jobCollections: ", jc);
    // NB: all Jobs must belong to a JobCollection (only those will be displayed here)
    const newJobs: SelectedJobCollection[] = jc.map((jc) => ({
      jobCollection: jc,
      selected: false,
      open: false,
      subJobs: jc.jobIds
        ? jc.jobIds.reduce(
            (acc: { [key: string]: boolean }, jobUid: string) => ({
              ...acc,
              [jobUid]: false,
            }),
            {}
          )
        : {},
    }));

    updateJobContext(newJobs);
    setJobCollections(newJobs);
  }

  const handleAnchor = (target: HTMLButtonElement, uid: string) => {
    console.log("Opening job collection with uid: ", target, uid);
    setAnchorEl(target);
    openJobCollection(uid);
  };

  const openJobCollection = (uid: string) => {
    const idx = jobCollections.findIndex((jc) => jc.jobCollection.uid === uid);
    if (poperID !== idx) {
      setPopperID(idx);
    } else {
      setPopperID(-1);
    }
  };

  function getRowId(value: SelectedJobCollection) {
    return value.jobCollection.uid;
  }

  useEffect(() => {
    console.log("useEffect in JobsSelector triggered");
    if (context?.selectedFunction === undefined || jobCollections.length > 0) {
      return;
    } else {
      console.log("Function selected: ", context?.selectedFunction?.uid);
      (async () => {
        await updateJobCollections(context?.selectedFunction?.uid as string);
        setLoading(false);
        console.log("Updated JobCollections");
      })();
    }
  }, [context?.selectedFunction]);
  // TODO include button to "refresh" job collections using the function above

  return (
    <>
      <DataGrid
        rows={jobCollections as SelectedJobCollection[]}
        columns={[
          {
            field: "subJobs",
            headerName: "",
            sortable: false,
            maxWidth: 80,
            type: "boolean",
            renderHeader: () => (
              <IconButton
                sx={(theme) => ({
                  padding: "8px",
                  alignSelf: "right",
                  color: theme.palette.primary.contrastText,
                })}
                onClick={async () => {
                  await updateJobCollections(
                    context?.selectedFunction?.uid as string
                  );
                }}
              >
                <Refresh />
              </IconButton>
            ),
            renderCell: (params) => (
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={(e) => {
                  const { currentTarget } = e;
                  handleAnchor(currentTarget, params.row.jobCollection.uid);
                }}
                sx={(theme) => ({ color: theme.palette.primary.contrastText })}
              >
                {poperID > -1 && jobCollections[poperID].jobCollection.uid ===
                params.row.jobCollection.uid ? (
                  <KeyboardArrowUp />
                ) : (
                  <KeyboardArrowDown />
                )}
              </IconButton>
            ),
          },
          {
            field: "selected",
            headerName: "Selected",
            maxWidth: 80,
            type: "boolean",
            renderCell: (params) => (
              <Checkbox
                checked={params.row.selected}
                onChange={(event) =>
                  selectMainJob(
                    params.row.jobCollection.uid,
                    event.target.checked
                  )
                }
              />
            ),
          },
          {
            field: "jobCollection",
            headerName: "Job Run",
            flex: 1,
            minWidth: 200,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => (
              <span>{params.row.jobCollection.title}</span>
            ),
          },
          {
            field: "status",
            headerName: "Status",
            align: "right",
            headerAlign: "right",
            maxWidth: 120,
            renderCell: (params) => <span>TODO</span>,
          },
          {
            field: "nJobs",
            headerName: "N Jobs",
            align: "right",
            headerAlign: "right",
            type: "number",
            maxWidth: 120,
            renderCell: (params) => (
              <span>{Object.keys(params.row.subJobs).length}</span>
            ),
          },
          {
            field: "createdAt",
            headerName: "Created At",
            type: "dateTime",
            align: "right",
            headerAlign: "right",
            width: 180,
            renderCell: (params) => <span>TODO</span>,
          },
        ]}
        sx={{
          borderRadius: "8px",
          overflow: "hidden",
          fontFamily: "inherit",
          padding: "0px 8px",
          "& .MuiDataGrid-cell": {
            fontWeight: 400,
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: (theme) =>
              `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${
                theme.palette.mode === "dark" ? "black" : "white"
              })`,
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: (theme) => theme.palette.primary.main,
          },
          "& .MuiDataGrid-row.Mui-selected:hover": {
            backgroundColor: (theme) => theme.palette.primary.main,
          },
          "& .MuiDataGrid-sortButton": {
            backgroundColor: (theme) => theme.palette.background.paper,
          },
        }}
        onRowClick={(params) => context?.setSelectedFunction(params.row)}
        getRowId={getRowId}
        showToolbar
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "title", sort: "asc" }],
          },
          filter: {
            filterModel: {
              items: [],
            },
          },
        }}
        pageSizeOptions={[5, 10, 20, 50]}
        loading={loading}
        disableColumnMenu
        disableColumnSelector
        disableRowSelectionOnClick
      ></DataGrid>
      {/* <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell>
                <IconButton
                  sx={(theme) => ({
                    padding: "8px",
                    alignSelf: "right",
                    color: theme.palette.primary.contrastText,
                  })}
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
                    selectMainJob(item.jobCollection.uid, selected)
                  }
                  selectJob={(selected: boolean, subJob: string) =>
                    onSelectJob(idx, selected, subJob)
                  }
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer> */}
      <Popper
        open={poperID !== -1}
        anchorEl={anchorEl}
        placement="right"
      >
        { poperID !== -1 && jobCollections[poperID] &&
          <Card>
          <Box style={{ padding: "20px" }}>
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
                  {jobCollections[poperID].jobCollection.jobIds?.map((jobUid: string) => (
                    <JobRow
                      key={jobUid}
                      jobUid={jobUid}
                      jobList={jobCollections[poperID].subJobs}
                      setSelected={(selected: boolean, subJob: string) =>
                        onSelectJob(poperID, selected, subJob)
                      }
                    />
                  ))}
                </TableBody>
              </Table>
          </Box>
        </Card>
        }
      </Popper>
    </>
  );
}
