import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Button,
  Card,
  Checkbox,
  ClickAwayListener,
  IconButton,
  Popper,
  TableContainer,
  TablePagination,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import JobRow from "./JobRow";

type JobSelectorPropsType = {
  loading: boolean
  setLoading: (loading: boolean) => void
  progress: number
  setProgress: (progress: number) => void
  jobProgress: number
  setJobProgress: (progress: number) => void
  jobsFetched: React.MutableRefObject<number>
  colsFetched: React.MutableRefObject<number>
}

export default function JobsSelector(props: JobSelectorPropsType) {
  const {
    selectedFunction,
    setSelectedJobUids,
    fetchedJobCollections,
    setFetchedJobCollections,
    setIsSuMoGenerated,
  } = useMMUXContext();
  const { colsFetched, jobProgress, jobsFetched, loading, progress, setJobProgress, setLoading, setProgress } = props;
  const [jobCollections, setJobCollections] = useState<SelectedJobCollection[]>(
    []
  );
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const [poperID, setPopperID] = useState<number>(-1);
  const poperOpen = useRef(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = React.useState(0);


  const updateJobContext = useCallback((jobs: SelectedJobCollection[]) => {
    const newList = jobs
      .map((j) => j.subJobs.filter((j) => j.selected).map((j) => j.job.uid))
      .flat();
    setSelectedJobUids(newList);
  }, [setSelectedJobUids]);

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
    console.info(
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

  const onSelectAllClick = (checked: boolean) => {
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
    console.info("Fetching jobCollections for function: ", functionUid);
    if (fetchedJobCollections.length > 0) {
      console.info("Job collections already fetched, skipping fetch.");
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
    console.info("Fetched jobCollections: ", jobsC, totalSubs);

    if (jobsC.length === 0) {
      console.info("No job collections found for function: ", functionUid);
      setJobCollections([]);
      setFetchedJobCollections([]);
      setLoading(false);
      return;
    }

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
        console.info(
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

    setJobCollections(newJobs);
    setFetchedJobCollections(newJobs);
    updateJobContext(newJobs);
    setProgress(100);
  }

  const handleAnchor = (target: HTMLButtonElement, uid: string) => {
    console.info("Opening job collection with uid: ", target, uid);
    setAnchorEl(target);
    openJobCollection(uid);
  };

  const openJobCollection = (uid: string) => {
    const idx = jobCollections.findIndex((jc) => jc.jobCollection.uid === uid);
    if (poperID !== idx) {
      setPopperID(idx);
    } else {
      setPopperID(-1);
      poperOpen.current = false;
    }
  };

  const handleClickAway = () => {
    if (poperID !== -1 && anchorEl && poperOpen.current) {
      console.info("Closing job collection popper", poperID, anchorEl);
      setAnchorEl(null);
      setPopperID(-1);
      poperOpen.current = false;
    } else {
      poperOpen.current = true;
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

  const onToggleAll = useCallback((checked: boolean) => {
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(
      (jc) => {
        const auxJob = jc;
        auxJob.selected = checked;
        auxJob.subJobs = jc.subJobs.map((subJob) => ({
          selected: checked,
          job: subJob.job,
        }));
        return auxJob;
      }
    );

    setJobCollections(newJobCollections);
    updateJobContext(newJobCollections);
  }, [jobCollections, updateJobContext]);

  const autoSelectJobs = useCallback(() => {
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(
      (jc) => {
        const auxJob = jc;
        auxJob.selected = true;
        auxJob.subJobs = jc.subJobs.map((subJob) => ({
          selected: subJob.job.status === "SUCCESS",
          job: subJob.job,
        }));
        return auxJob;
      }
    );

    setJobCollections(newJobCollections);
    updateJobContext(newJobCollections);
  }, [jobCollections, updateJobContext]);

  useEffect(() => {
    if (jobCollections.length > 0 && loading === true) {
      onToggleAll(true);
      setLoading(false);
      setIsSuMoGenerated(true);
    }
  }, [jobCollections, loading, onToggleAll, setIsSuMoGenerated, setLoading, updateJobContext]);

  useEffect(() => {
    console.info("useEffect in JobsSelector triggered");
    if (selectedFunction === undefined || jobCollections.length > 0) {
      return;
    } else {
      console.info("Function selected: ", selectedFunction.uid);
      (async () => {
        await updateJobCollections(selectedFunction?.uid as string);
        console.info("Updated JobCollections");
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction]);

  const getJobCollectionStatus = (subJobs: SubJob[]) => {
    if (!subJobs || subJobs.length === 0) return "EMPTY";
    const result = subJobs.filter((j) => j.job).map((j) => j.job.status).reduce(
      (acc, status) => {
        if (status === "SUCCESS") acc.success += 1;
        else if (status === "STARTED") acc.running += 1;
        else if (status === "FAILED") acc.failed += 1;
        // else if (status === "PENDING") acc.pending += 1;
        else acc.incomplete += 1;
        return acc;
      },
      { success: 0, running: 0, failed: 0, incomplete: 0 }
    );

    const allComplete = result.success === subJobs.length;
    const anyComplete = result.success > 0;
    const anyRunning = result.running > 0;
    const anyFailed = result.failed > 0;
    const allFailed = result.failed === subJobs.length;
    if (allComplete) return "COMPLETE";
    if (anyRunning) return "RUNNING";
    if (allFailed) return "FAILED";
    if (anyFailed && anyComplete) return "FAILED (PARTIALLY)";
    // Default fallback
    return "UNKNOWN";
  };

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
                  setLoading(true);
                  setProgress(0);
                  setJobProgress(0);
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
            maxWidth: 220,
            renderCell: (params) => (
              <span>{getJobCollectionStatus(params.row.subJobs)}</span>
            ),
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
          // {
          //   field: "createdAt",
          //   headerName: "Created At",
          //   type: "dateTime",
          //   align: "right",
          //   headerAlign: "right",
          //   width: 180,
          //   renderCell: (params) => <span>TODO</span>,
          // },
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
              `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.mode === "dark" ? "black" : "white"
              })`,
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: (theme) =>
              `color-mix(in srgb, ${theme.palette.primary.main} 70%, ${theme.palette.mode === "dark" ? "black" : "white"
              })`,
          },
          "& .MuiDataGrid-row.Mui-selected:hover": {
            backgroundColor: (theme) =>
              `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.mode === "dark" ? "black" : "white"
              })`,
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
      <ClickAwayListener onClickAway={handleClickAway}>
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
                            onChange={(e) => onSelectAllClick(e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>Job ID</TableCell>
                        <TableCell>Inputs</TableCell>
                        <TableCell>Outputs</TableCell>
                        <TableCell align="right">Status</TableCell>
                        <TableCell align="right"></TableCell>
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
      </ClickAwayListener>
      <Box sx={{ display: "flex", justifyContent: 'center', alignItems: "center", gap: "16px" }}>
        <Button
          variant="contained"
          size="medium"
          sx={{ marginTop: "8px", marginBottom: "8px" }}
          onClick={async () => {
            onToggleAll(true);
          }}
        >
          Select all Jobs
        </Button>
        <Button
          variant="contained"
          size="medium"
          sx={{ marginTop: "8px", marginBottom: "8px" }}
          onClick={async () => {
            autoSelectJobs();
          }}
        >
          Auto select Jobs
        </Button>
        <Button
          variant="contained"
          size="medium"
          sx={{ marginTop: "8px", marginBottom: "8px" }}
          onClick={async () => {
            onToggleAll(false);
          }}
        >
          De-select all Jobs
        </Button>
      </Box>
    </>
  );
}