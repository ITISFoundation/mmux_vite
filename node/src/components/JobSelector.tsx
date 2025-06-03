import React, { useEffect, useRef, useState } from "react";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useMMUXContext } from "../context/MMUXContext";
import { FunctionJob } from "../osparc-api-ts-client";
import {
  getFunctionJobCollections,
  getFunctionJob,
} from "../utils/function_utils";
import {
  Box,
  Card,
  Checkbox,
  IconButton,
  LinearProgress,
  Popper,
  TableContainer,
  TablePagination,
  Typography,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import JobRow from "./JobRow";

export default function JobsSelector() {
  const {
    selectedFunction,
    setSelectedJobUids,
    fetchedJobCollections,
    setFetchedJobCollections,
  } = useMMUXContext();
  const [jobCollections, setJobCollections] = useState<SelectedJobCollection[]>(
    []
  );
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const [poperID, setPopperID] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [page, setPage] = React.useState(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  const updateJobContext = (jobs: SelectedJobCollection[]) => {
    const newList = jobs
      .map((j) => j.subJobs.filter((j) => j.selected).map((j) => j.job.uid))
      .flat();
    setSelectedJobUids(newList);
  };

  const selectMainJob = (uid: string, selected: boolean) => {
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(
      (jc) => {
        const auxJob = jc;
        if (jc.jobCollection.uid === uid) {
          auxJob.selected = selected;
          auxJob.subJobs = auxJob.subJobs.map((j) => ({
            selected: selected,
            job: j.job,
          }));
        }
        return auxJob;
      }
    );

    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  const onSelectJob = (index: number, selected: boolean, subJob: string) => {
    console.log(
      "Selecting subJob: ",
      subJob,
      " at index: ",
      index,
      " with selected: ",
      selected
    );
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(
      (jc, idx) => {
        const auxJob = jc;
        if (idx === index) {
          const jobId = jc.subJobs.findIndex((j) => j.job.uid === subJob);
          auxJob.subJobs[jobId].selected = selected;
          const subJobState = auxJob.subJobs.map((j) => j.selected);
          if (
            subJobState.every((j) => j === true) ||
            subJobState.every((j) => j === false)
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
    const newSubJobs = jobCollections[poperID].subJobs.map((subJob) => ({
      selected: checked,
      job: subJob.job,
    }));
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(
      (jc, idx) => {
        const auxJob = jc;
        if (idx === poperID) {
          auxJob.selected = checked;
          auxJob.subJobs = newSubJobs;
        }
        return auxJob;
      }
    );
    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  async function updateJobCollections(functionUid: string) {
    console.log("Fetching jobCollections for function: ", functionUid);
    if (fetchedJobCollections.length > 0) {
      console.log("Job collections already fetched, skipping fetch.");
      setJobCollections(fetchedJobCollections);
      setLoading(false);
      return;
    }
    const jobsC = (await getFunctionJobCollections(
      functionUid as string
    )) as FunctionJobCollection[];
    const totalSubs = jobsC.reduce((acc, jc) => acc + jc.jobIds.length, 0);
    colsFetched.current = 0;
    jobsFetched.current = 0;
    console.log("Fetched jobCollections: ", jobsC, totalSubs);

    const newJobs: SelectedJobCollection[] = await Promise.all(
      jobsC.map(async (jc) => {
        const subJobs = await Promise.all(
          jc.jobIds.map(async (id) => {
            const job = (await getFunctionJob(id)) as FunctionJob;
            jobsFetched.current += 1;
            const jobsProg = (jobsFetched.current / totalSubs) * 100;
            setJobProgress(jobsProg);
            return {
              selected: false,
              job,
            };
          })
        );
        console.log(
          "Fetched subJobs for jobCollection: ",
          progress,
          jobProgress,
          jobsFetched.current
        );
        colsFetched.current += jc.jobIds.length;
        setProgress((colsFetched.current / totalSubs) * 100);
        return {
          jobCollection: jc,
          selected: false,
          subJobs: subJobs,
        };
      })
    );

    updateJobContext(newJobs);
    setJobCollections(newJobs);
    setProgress(100);
    setFetchedJobCollections(newJobs);
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

  const visibleSubJobs = React.useMemo(() => {
    if (
      poperID > -1 &&
      jobCollections[poperID] &&
      jobCollections[poperID].subJobs
    ) {
      return [...jobCollections[poperID].jobCollection.jobIds].slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );
    } else {
      return [];
    }
  }, [jobCollections, page, poperID, rowsPerPage]);

  function getRowId(value: SelectedJobCollection) {
    return value.jobCollection.uid;
  }

  useEffect(() => {
    console.log("useEffect in JobsSelector triggered");
    if (selectedFunction === undefined || jobCollections.length > 0) {
      return;
    } else {
      console.log("Function selected: ", selectedFunction.uid);
      (async () => {
        await updateJobCollections(selectedFunction?.uid as string);
        setLoading(false);
        console.log("Updated JobCollections");
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction]);

  if (loading) {
    console.log(
      "Loading job collections...",
      colsFetched.current,
      jobsFetched.current
    );
    return (
      <>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <LinearProgress
            variant="buffer"
            value={progress}
            valueBuffer={jobProgress}
            sx={{ height: "6px", width: "40%" }}
          />
        </Box>
        <Typography
          variant="body1"
          fontFamily={"inherit"}
          fontWeight={100}
          textAlign={"center"}
          mt={0.5}
        >
          <span>{Math.round(progress)}%</span>
        </Typography>
      </>
    );
  }

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
                    selectedFunction?.uid ? selectedFunction.uid : ""
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
                {poperID > -1 &&
                jobCollections[poperID].jobCollection.uid ===
                  params.row.jobCollection.uid ? (
                  <KeyboardArrowDown style={{ transform: "rotate(90deg)" }} />
                ) : (
                  <KeyboardArrowUp style={{ transform: "rotate(90deg)" }} />
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
                indeterminate={
                  params.row.subJobs.some((j) => j.selected) &&
                  !params.row.subJobs.every((j) => j.selected)
                }
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
      <Popper open={poperID !== -1} anchorEl={anchorEl} placement="right">
        {poperID !== -1 && jobCollections[poperID] && (
          <Card sx={{ borderRadius: "8px" }}>
            <Box style={{ padding: "16px" }}>
              <TableContainer>
                <Table
                  size="small"
                  aria-label="jobs"
                  sx={{ borderRadius: "8px", padding: "16px" }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Checkbox
                          checked={jobCollections[poperID].subJobs.every(
                            (j) => j.selected
                          )}
                          onChange={onSelectAllClick}
                        />
                      </TableCell>
                      <TableCell>Job ID</TableCell>
                      <TableCell>Inputs</TableCell>
                      <TableCell>Outputs</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleSubJobs?.map((jobUid: string) => (
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
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 20, 30]}
                component="div"
                count={jobCollections[poperID].jobCollection.jobIds.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) =>
                  setRowsPerPage(parseInt(e.target.value, 10))
                }
              />
            </Box>
          </Card>
        )}
      </Popper>
    </>
  );
}
