import { InfoOutline, KeyboardArrowDown, KeyboardArrowUp, Refresh } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  ClickAwayListener,
  IconButton,
  Popper,
  TableContainer,
  TablePagination,
} from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DataGrid } from "@mui/x-data-grid";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import { useSamplingContext } from "../../context/SamplingContext";
import { getJobCollectionStatus } from "../../utils/function_utils";
import getMinMax from "../minmax";
import CustomTooltip from "../utils/CustomTooltip";
import JobRow from "./JobRow";

type JobSelectorPropsType = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setJobProgress: (progress: number) => void;
};

function getRowId(value: SelectedJobCollection) {
  return value.jobCollection.uid;
}

export default function JobsSelector(props: JobSelectorPropsType) {
  const { selectedFunction } = useFunctionContext();
  const { launchingSampling, runningSampling } = useSamplingContext();
  const { setSelectedJobUids, fetchedJobCollections, requestForceFetch } = useJobContext();
  const { setIsSuMoGenerated } = useMMUXContext();
  const { loading, setLoading, setJobProgress } = props;
  const [jobCollections, setJobCollections] = useState<SelectedJobCollection[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [poperID, setPopperID] = useState<number>(-1);
  const poperOpen = useRef(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = React.useState(0);

  const updateJobContext = useCallback(
    (jobs: SelectedJobCollection[]) => {
      const newList = jobs.map(j => j.subJobs.filter(k => k.selected).map(l => l.job.uid)).flat();
      setSelectedJobUids(newList);
    },
    [setSelectedJobUids],
  );

  const selectMainJob = (uid: string, selected: boolean) => {
    const newJobCollections: SelectedJobCollection[] = jobCollections.map(jc => {
      const auxJob = jc;
      if (jc.jobCollection.uid === uid) {
        auxJob.subJobs = auxJob.subJobs.map(j => ({
          selected: selected === true ? j.job.status === "SUCCESS" : false,
          job: j.job,
        }));
        auxJob.selected = selected === true ? auxJob.subJobs.some(j => j.selected === true) : false;
      }
      return auxJob;
    });

    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  const onSelectJob = (index: number, selected: boolean, subJob: string) => {
    console.info("Selecting subJob: ", subJob, " at index: ", index, " with selected: ", selected);
    const newJobCollections: SelectedJobCollection[] = jobCollections.map((jc, idx) => {
      const auxJob = jc;
      if (idx === index) {
        const jobId = jc.subJobs.findIndex(j => j.job.uid === subJob);
        auxJob.subJobs[jobId].selected = selected;
        const subJobState = auxJob.subJobs.map(j => j.selected);
        if (subJobState.every(j => j === true) || subJobState.every(j => j === false)) {
          [auxJob.selected] = subJobState;
        }
      }
      return auxJob;
    });
    setAnchorEl(null);
    setPopperID(-1);
    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  const onSelectAllClick = (checked: boolean) => {
    const newSubJobs = jobCollections[poperID].subJobs.map(subJob => ({
      selected: checked,
      job: subJob.job,
    }));
    const newJobCollections: SelectedJobCollection[] = jobCollections.map((jc, idx) => {
      const auxJob = jc;
      if (idx === poperID) {
        auxJob.selected = checked;
        auxJob.subJobs = newSubJobs;
      }
      return auxJob;
    });
    updateJobContext(newJobCollections);
    setJobCollections(newJobCollections);
  };

  const openJobCollection = (uid: string) => {
    const idx = jobCollections.findIndex(jc => jc.jobCollection.uid === uid);
    if (poperID !== idx) {
      setPopperID(idx);
      setPage(0);
    } else {
      setPopperID(-1);
      poperOpen.current = false;
    }
  };

  const handleAnchor = (target: HTMLButtonElement, uid: string) => {
    console.info("Opening job collection with uid: ", target, uid);
    setAnchorEl(target);
    openJobCollection(uid);
  };

  const handleClickAway = (e: Event) => {
    if ((e.target as HTMLElement).localName && (e.target as HTMLElement).localName === "body") {
      // If the click is on the select inside the popper, do not close it
      return;
    }
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
    if (poperID > -1 && jobCollections[poperID] && jobCollections[poperID].subJobs) {
      return [...jobCollections[poperID].jobCollection.jobIds].slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }
    return [];
  }, [jobCollections, page, poperID, rowsPerPage]);

  const onToggleAll = useCallback(
    (checked: boolean) => {
      const newJobCollections: SelectedJobCollection[] = jobCollections.map(jc => {
        const auxJob = jc;
        auxJob.subJobs = jc.subJobs.map(subJob => ({
          selected: checked === true ? subJob.job.status === "SUCCESS" : false,
          job: subJob.job,
        }));
        const auxJobState = auxJob.subJobs.map(j => j.selected);
        auxJob.selected = checked === true ? !auxJobState.every(j => j === false) : false;
        return auxJob;
      });

      setJobCollections(newJobCollections);
      updateJobContext(newJobCollections);
    },
    [jobCollections, updateJobContext],
  );

  // const autoSelectJobs = useCallback(() => {
  //   const newJobCollections: SelectedJobCollection[] = jobCollections.map(jc => {
  //     const auxJob = jc;
  //     auxJob.subJobs = jc.subJobs.map(subJob => ({
  //       selected: subJob.job.status === "SUCCESS",
  //       job: subJob.job,
  //     }));
  //     const auxJobState = auxJob.subJobs.map(j => j.selected);
  //     auxJob.selected = !auxJobState.every(j => j === false);
  //     return auxJob;
  //   });

  //   setJobCollections(newJobCollections);
  //   updateJobContext(newJobCollections);
  // }, [jobCollections, updateJobContext]);

  const handleJobsUpdate = useCallback(async () => {
    await requestForceFetch(selectedFunction?.uid as string, setJobProgress);
    console.info("Updated JobCollections");
  }, [requestForceFetch, selectedFunction, setJobProgress]);

  useEffect(() => {
    if (jobCollections.length > 0 && loading === true) {
      onToggleAll(true);
      setLoading(false);
      setIsSuMoGenerated(true);
    }
  }, [jobCollections, loading, onToggleAll, setIsSuMoGenerated, setLoading, updateJobContext]);

  useEffect(() => {
    if (fetchedJobCollections) {
      setJobCollections(fetchedJobCollections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedJobCollections]);

  useEffect(() => {
    console.info("useEffect in JobsSelector triggered", selectedFunction, jobCollections);
    if (selectedFunction === undefined || jobCollections.length > 0) {
      return;
    }
    console.info("Function selected: ", selectedFunction.uid);
    handleJobsUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction]);

  useEffect(() => {
    if (selectedFunction !== undefined && launchingSampling === false && runningSampling === true) {
      (async () => {
        await requestForceFetch(selectedFunction?.uid ? selectedFunction.uid : "", setJobProgress);
        console.info("Updated JobCollections");
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction, launchingSampling, runningSampling]);

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
                sx={theme => ({
                  padding: "8px",
                  alignSelf: "right",
                  color: theme.palette.primary.contrastText,
                })}
                onClick={async () => {
                  await requestForceFetch(selectedFunction?.uid ? selectedFunction.uid : "", setJobProgress);
                }}
              >
                <Refresh />
              </IconButton>
            ),
            renderCell: params => (
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={e => {
                  const { currentTarget } = e;
                  handleAnchor(currentTarget, params.row.jobCollection.uid);
                }}
                sx={theme => ({ color: theme.palette.primary.contrastText })}
              >
                {poperID > -1 && jobCollections[poperID].jobCollection.uid === params.row.jobCollection.uid ? (
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
            sortable: false,
            headerClassName: "checkbox-header",
            renderHeader: () => (
              <Checkbox
                checked={jobCollections.length > 0 && jobCollections.every(jc => jc.selected === true)}
                indeterminate={
                  jobCollections.some(jc => jc.selected === true) &&
                  !jobCollections.every(
                    jc => jc.subJobs.map(j => j.job).filter(j => j.status === "SUCCESS" && j.selected === true).length > 0,
                  )
                }
                onChange={event => onToggleAll(event.target.checked)}
                inputProps={{ "aria-label": "Select all jobs" }}
                sx={theme => ({ "& .MuiSvgIcon-root": { color: `${theme.palette.primary.main} !important` } })}
              />
            ),
            renderCell: params => (
              <Checkbox
                checked={params.row.selected}
                indeterminate={params.row.subJobs.some(j => j.selected) && !params.row.subJobs.every(j => j.selected)}
                onChange={event => selectMainJob(params.row.jobCollection.uid, event.target.checked)}
                disabled={params.row.subJobs.every((j: SubJob) => j.job.status !== "SUCCESS")}
                inputProps={{ "aria-label": "Select job collection" }}
                sx={theme => ({ "& .MuiSvgIcon-root": { color: `${theme.palette.primary.main} !important` } })}
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
            renderCell: params => (
              <Box alignItems="center" justifyContent="left" display="flex" gap={1}>
                <CustomTooltip title={params.row.jobCollection.uid} placement="bottom-start">
                  <InfoOutline color="primary" />
                </CustomTooltip>
                <span>{params.row.jobCollection.title}</span>
              </Box>
            ),
          },
          {
            field: "Min-Max",
            headerName: "Min-Max",
            align: "left",
            headerAlign: "left",
            minWidth: 115,
            maxWidth: 115,
            renderCell: params => (
              <CustomTooltip title={getMinMax(params.row.subJobs)} placement="left">
                <Chip
                  color="primary"
                  variant="outlined"
                  size="medium"
                  label={
                    <Box alignItems="center" justifyContent="center" display="flex" gap={1}>
                      <InfoOutline /> Min-Max
                    </Box>
                  }
                />
              </CustomTooltip>
            ),
          },
          {
            field: "status",
            headerName: "Status",
            align: "left",
            headerAlign: "left",
            maxWidth: 220,
            renderCell: params => <span>{getJobCollectionStatus(params.row.subJobs)}</span>,
          },
          {
            field: "nJobs",
            headerName: "N Jobs",
            align: "right",
            headerAlign: "right",
            type: "number",
            maxWidth: 120,
            renderCell: params => <span>{Object.keys(params.row.subJobs).length}</span>,
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
        sx={theme => ({
          borderRadius: theme.spacing(2),
          overflow: "hidden",
          fontFamily: "inherit",
          padding: "0px 8px",
          "& .MuiDataGrid-cell": {
            fontWeight: 400,
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.mode === "dark" ? "black" : "white"}`,
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 70%, ${theme.palette.mode === "dark" ? "black" : "white"}`,
          },
          "& .MuiDataGrid-row.Mui-selected:hover": {
            backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.mode === "dark" ? "black" : "white"}`,
          },
          "& .MuiDataGrid-sortButton": {
            backgroundColor: theme.palette.background.paper,
          },
        })}
        getRowId={getRowId}
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
      />
      <ClickAwayListener onClickAway={handleClickAway}>
        <Popper open={poperID !== -1} anchorEl={anchorEl} placement="right">
          {poperID !== -1 && jobCollections[poperID] && (
            <Card sx={theme => ({ borderRadius: theme.spacing(2) })}>
              <Box style={{ padding: "16px" }}>
                <TableContainer sx={{ maxHeight: 800 }}>
                  <Table
                    size="small"
                    aria-label="jobs"
                    sx={theme => ({
                      borderRadius: theme.spacing(2),
                      padding: theme.spacing(4),
                    })}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Checkbox
                            checked={jobCollections[poperID].subJobs.every(j => j.selected)}
                            onChange={e => onSelectAllClick(e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>Job ID</TableCell>
                        <TableCell>Inputs</TableCell>
                        <TableCell>Outputs</TableCell>
                        <TableCell align="right" width={100}>
                          Status
                        </TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visibleSubJobs?.map((jobUid: string) => (
                        <JobRow
                          key={jobUid}
                          jobUid={jobUid}
                          jobList={jobCollections[poperID].subJobs}
                          selectedFunction={selectedFunction}
                          setSelected={(selected: boolean, subJob: string) => onSelectJob(poperID, selected, subJob)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  id="job-collection-pagination"
                  rowsPerPageOptions={[10, 20, 30]}
                  component="div"
                  count={jobCollections[poperID].jobCollection.jobIds.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={e => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </Box>
            </Card>
          )}
        </Popper>
      </ClickAwayListener>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Button
          variant="contained"
          size="medium"
          sx={{ marginTop: "8px", marginBottom: "8px" }}
          onClick={async () => {
            onToggleAll(true);
          }}
        >
          Select all successful Jobs
        </Button>
        {/* <Button
          variant="contained"
          size="medium"
          sx={{ marginTop: "8px", marginBottom: "8px" }}
          onClick={async () => {
            autoSelectJobs();
          }}
        >
          Auto select Jobs
        </Button> */}
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
