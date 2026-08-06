import { useState, useEffect } from "react";
import { Box, IconButton, Typography, Button } from "@mui/material";
import { toast } from "react-toastify";
import { Refresh } from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import {
  JSONFunctionInputSchema,
  JSONFunctionOutputSchema,
  RegisteredSolverFunction,
  RegisteredProjectFunction,
  RegisteredPythonCodeFunction,
} from "osparc-api-ts-client";
import { RegisteredFunction } from "../../context/types";
import { listFunctions, getFunctionJobCollections } from "../../utils/functionUtils";
import { HelpContents } from "../navigation/TutorialManualLinks";
import { useFunctionContext } from "../../context/FunctionContext";
import { useSamplingContext } from "../../context/SamplingContext";
import { useJobContext } from "../../context/JobContext";
import UploadJobCollectionButton, { UploadJobCollectionSuccessResult } from "../data/UploadJobCollectionButton";

function NFunctionJobCollections(props: {
  fun: RegisteredFunction;
  jobCollectionCount: { [key: string]: number };
  jobCount: { [key: string]: number };
}): React.ReactNode {
  const { fun, jobCollectionCount, jobCount } = props;
  return (
    <Box>
      {jobCollectionCount[fun.uid] === undefined || jobCount[fun.uid] === undefined
        ? "Loading..."
        : `Campaigns: ${jobCollectionCount[fun.uid]} (${jobCount[fun.uid]} total evaluations)`}
    </Box>
  );
}

function getRowId(row: RegisteredFunction) {
  return row.uid ? row.uid : `${row.title}${row.description}`;
}

export function FunctionList() {
  const { selectedFunction, setSelectedFunction, setInputVars, setOutputVars, setDistribution, distributionUserModified } =
    useFunctionContext();
  const { setLhsSamplingConfig, setGridSamplingConfig, setSingleJobConfig, clearSampling } = useSamplingContext();
  const { setSelectedJobUids, setFetchedJobCollections } = useJobContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [functions, setFunctions] = useState<RegisteredFunction[]>([]);
  const [jobCollectionCount, setJobCollectionCount] = useState<{
    [key: string]: number;
  }>({});
  const [jobCount, setJobCount] = useState<{ [key: string]: number }>({});
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: "include", ids: new Set() });

  const fetchJobJobCollectionCount = async (fun: RegisteredFunction) => {
    try {
      const jcs = await getFunctionJobCollections(fun.uid);
      const jobColCount = jcs.length;
      const JobCount = jcs.map(jc => (jc.jobIds ? jc.jobIds.length : 0)).reduce((a, b) => a + b, 0);
      return {
        "Function Uid": fun.uid,
        "Job Collection Count": jobColCount,
        "Job Count": JobCount,
      };
    } catch (err) {
      console.warn("Error fetching job count for Function ", fun.uid);
      console.error(err);
    }
    return undefined;
  };

  const fetchFunctions = async (): Promise<RegisteredFunction[]> => {
    let funs: RegisteredFunction[] = [];
    try {
      setLoading(true);
      funs = await listFunctions();
      setFunctions(funs);
      if (funs.length === 0) {
        toast.info("No functions available. Please create a function first.");
      } else {
        const fetchedCounts = await Promise.all(funs.map(fun => fetchJobJobCollectionCount(fun)));
        const jcCount: { [key: string]: number } = {};
        const jCount: { [key: string]: number } = {};
        fetchedCounts.forEach(item => {
          if (item) {
            jcCount[item["Function Uid"]] = item["Job Collection Count"];
            jCount[item["Function Uid"]] = item["Job Count"];
          }
        });
        setJobCollectionCount(jcCount);
        setJobCount(jCount);
      }
      setError(false);
    } catch (err) {
      console.error("Error fetching functions:", err);
      setError(true);
      toast.error("Error fetching functions. Please try again later.");
    }
    setLoading(false);
    return funs;
  };

  const showInputOutputSchema = (schema: JSONFunctionInputSchema | JSONFunctionOutputSchema) => {
    if (schema === undefined || schema.schemaContent === undefined || schema.schemaContent.properties === undefined) {
      console.error("Invalid schema:", schema);
      return [];
    }

    const vars = Object.keys(schema.schemaContent.properties);
    return vars.join(", ");
  };

  const getFunctionSolver = (fun: RegisteredFunction) => {
    if ((fun as RegisteredSolverFunction).solverKey) {
      return `${(fun as RegisteredSolverFunction).solverKey.split("/").slice(-1)[0]}:${(fun as RegisteredSolverFunction).solverVersion}`;
    }
    if ((fun as RegisteredProjectFunction).projectId) {
      const handleInfoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Send a postMessage to the parent iframe
        window.parent.postMessage(
          {
            type: "openFunction",
            message: {
              functionId: (fun as RegisteredProjectFunction).projectId,
              uuid: (fun as RegisteredProjectFunction).uid,
            },
          },
          "*",
        );
      };

      return (
        <IconButton
          size="small"
          onClick={handleInfoClick}
          sx={theme => ({
            color: theme.palette.primary.light,
            backgroundColor: theme.palette.background.default,
          })}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      );
    }
    if ((fun as RegisteredPythonCodeFunction).codeUrl) {
      return (fun as RegisteredPythonCodeFunction).codeUrl;
    }
    return "Unknown";
  };

  const handleSelectedFunction = (F: RegisteredFunction | undefined) => {
    setSelectedFunction(F);
    setSelectedJobUids([]);
    setFetchedJobCollections(undefined);
    setInputVars([]);
    setLhsSamplingConfig({
      inputs: [],
      points: 50,
      seed: 0,
    });
    setGridSamplingConfig([]);
    setSingleJobConfig([]);
    clearSampling();
  };

  function setRowSelection(fun: RegisteredFunction) {
    if (selectedFunction && selectedFunction.uid === fun.uid) {
      handleSelectedFunction(undefined);
      setInputVars([]);
      setOutputVars([]);
      return;
    }
    handleSelectedFunction(fun);
    setInputVars(fun.inputSchema?.schemaContent?.properties ? Object.keys(fun.inputSchema.schemaContent.properties) : []);
    console.log("inputVars registered:", Object.keys(fun.inputSchema.schemaContent?.properties ?? {}));
    setOutputVars(fun.outputSchema?.schemaContent?.properties ? Object.keys(fun.outputSchema.schemaContent.properties) : []);
    console.log("outputVars registered:", Object.keys(fun.outputSchema.schemaContent?.properties ?? {}));
  }

  // V13: CSV upload -> 1 authoritative parsed result drives 4 effects atomically
  // {add fn, select fn, prefill bounds, infer dist/log}; a partial update (e.g. the
  // new function selected without its bounds/distribution) is never left visible.
  const handleCsvUploadSuccess = async (result: UploadJobCollectionSuccessResult) => {
    const funs = await fetchFunctions(); // add fn: refreshed list includes the newly created function
    const targetFunction = funs.find(fun => fun.uid === result.targetFunctionUid);
    if (!targetFunction) {
      toast.error("Uploaded function could not be found after creation.");
      return;
    }

    setRowSelection(targetFunction); // select fn (+ registers inputVars/outputVars)
    // B32: merge (not overwrite). Skip the inferred preset for any variable the user has
    // manually edited (distributionUserModified) so their config is never silently dropped
    // by a CSV upload. Vars without an entry keep their existing/default entry so direct
    // derefs of distribution[inputVar] don't crash.
    setDistribution(prev => {
      const existing = prev[targetFunction.uid] || {};
      const modified = distributionUserModified[targetFunction.uid] || {};
      const merged: Record<string, VarSelection> = { ...existing };
      for (const [variable, preset] of Object.entries(result.inputPresets)) {
        if (!modified[variable]) merged[variable] = preset as VarSelection;
      }
      return { ...prev, [targetFunction.uid]: merged };
    }); // prefill bounds + infer dist/log
  };

  const handleRowSelection = (newRowSelectionModel: GridRowSelectionModel) => {
    setRowSelectionModel(newRowSelectionModel);
    if (newRowSelectionModel.ids.size > 0) {
      const selectedRow = functions.find(row => getRowId(row) === newRowSelectionModel.ids.values().next().value);
      if (selectedRow) setRowSelection(selectedRow);
      else {
        handleSelectedFunction(undefined);
        setInputVars([]);
        setOutputVars([]);
      }
    }
  };

  useEffect(() => {
    (async () => {
      await fetchFunctions();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.info("Selected function changed:", selectedFunction);
    if (selectedFunction) {
      rowSelectionModel.ids.add(getRowId(selectedFunction));
    }
  }, [rowSelectionModel.ids, selectedFunction]);

  if (error) {
    return (
      <Box textAlign="center">
        <Typography variant="body1" fontFamily="inherit" fontSize="1.2em" fontWeight={300} display="inline" mr={1}>
          Error fetching functions from the server. Please try again after some time.
        </Typography>
        <IconButton size="small" onClick={async () => fetchFunctions()}>
          <Refresh color="primary" />
        </IconButton>
        <Box mt={1}>
          <UploadJobCollectionButton onUploadSuccess={handleCsvUploadSuccess} existingFunctions={functions} />
        </Box>
      </Box>
    );
  }

  if (!loading && functions.length === 0) {
    return (
      <Box textAlign="center">
        <Typography variant="body1" fontFamily="inherit" fontSize="1.2em" fontWeight={300} display="inline" mr={1}>
          <HelpContents type="FunctionsHelp" />
        </Typography>
        <Box mt={1}>
          <UploadJobCollectionButton onUploadSuccess={handleCsvUploadSuccess} existingFunctions={functions} />
        </Box>
      </Box>
    );
  }
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <UploadJobCollectionButton onUploadSuccess={handleCsvUploadSuccess} existingFunctions={functions} />
      </Box>
      <DataGrid
        onRowSelectionModelChange={newRowSelectionModel => {
          handleRowSelection(newRowSelectionModel);
        }}
        rowSelectionModel={rowSelectionModel}
        rows={functions}
        columns={[
          {
            field: "title",
            headerName: "Name",
            flex: 1,
            minWidth: 80,
            maxWidth: 200,
          },
          {
            field: "description",
            headerName: "Description",
            flex: 1,
            minWidth: 80,
            maxWidth: 260,
          },
          {
            field: "inputSchema",
            headerName: "Inputs",
            flex: 1,
            minWidth: 20,
            maxWidth: 100,
            renderCell: params => showInputOutputSchema(params.row.inputSchema),
          },
          {
            field: "outputSchema",
            headerName: "Outputs",
            flex: 1,
            minWidth: 20,
            maxWidth: 100,
            renderCell: params => showInputOutputSchema(params.row.outputSchema),
          },
          {
            field: "n_evaluations",
            headerName: "# Campaigns / Evaluations",
            flex: 1,
            minWidth: 100,
            maxWidth: 250,
            renderCell: params => (
              <NFunctionJobCollections fun={params.row} jobCollectionCount={jobCollectionCount} jobCount={jobCount} />
            ),
          },
          {
            field: "solverKey",
            headerName: "Further Info",
            align: "center",
            flex: 1,
            minWidth: 100,
            maxWidth: 100,
            renderCell: params => getFunctionSolver(params.row),
          },
          {
            field: "actions",
            headerName: "",
            sortable: false,
            flex: 0.5,
            headerAlign: "right",
            maxWidth: 130,
            minWidth: 130,
            renderHeader: () => (
              <IconButton
                sx={theme => ({
                  flex: 1,
                  padding: "8px",
                  alignSelf: "right",
                  color: theme.palette.primary.contrastText,
                })}
                onClick={async () => {
                  setLoading(true);
                  await fetchFunctions();
                }}
              >
                <Refresh />
              </IconButton>
            ),
            renderCell: params => (
              <Button
                variant="contained"
                fullWidth
                onClick={() => setRowSelection(params.row)}
                mmux-testid={`select-function-btn-${params.row.uid}`}
              >
                {selectedFunction?.uid === params.row.uid ? "Unselect" : "Select"}
              </Button>
            ),
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
            backgroundColor: theme =>
              `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.mode === "dark" ? "black" : "white"})`,
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: theme =>
              `color-mix(in srgb, ${theme.palette.primary.main} 70%, ${theme.palette.mode === "dark" ? "black" : "white"})`,
          },
          "& .MuiDataGrid-row.Mui-selected:hover": {
            backgroundColor: theme =>
              `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.mode === "dark" ? "black" : "white"})`,
          },
          "& .MuiDataGrid-sortButton": {
            backgroundColor: theme => theme.palette.background.paper,
          },
        }}
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
      />
    </Box>
  );
}
