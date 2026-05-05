import { useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { toast } from "react-toastify";
import Refresh from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  JSONFunctionInputSchema,
  JSONFunctionOutputSchema,
  Function as OsparcFunction,
  SolverFunction,
  ProjectFunction,
  PythonCodeFunction,
} from "../../osparc-api-ts-client";
import { listFunctions, getFunctionJobCollections } from "../../utils/functionUtils";
import { HelpContents } from "../navigation/TutorialManualLinks";
import { useFunctionContext } from "../../context/FunctionContext";
import { useSamplingContext } from "../../context/SamplingContext";
import { useJobContext } from "../../context/JobContext";
import UploadJobCollectionButton, { UploadJobCollectionSuccessResult } from "../data/UploadJobCollectionButton";

type FunctionGridRow = OsparcFunction & {
  isSelected: boolean;
};

function NFunctionJobCollections(props: {
  fun: OsparcFunction;
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

export function FunctionList() {
  const {
    selectedFunction,
    setSelectedFunction,
    setInputVars,
    setOutputVars,
    distribution,
    setDistribution,
    reconcileFunctions,
  } = useFunctionContext();
  const { setLhsSamplingConfig, setGridSamplingConfig, setSingleJobConfig, clearSampling } = useSamplingContext();
  const { setSelectedJobUids, setFetchedJobCollections } = useJobContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [functions, setFunctions] = useState<OsparcFunction[]>([]);
  const [jobCollectionCount, setJobCollectionCount] = useState<{
    [key: string]: number;
  }>({});
  const [jobCount, setJobCount] = useState<{ [key: string]: number }>({});
  const selectedFunctionUid = selectedFunction?.uid;
  const functionRows: FunctionGridRow[] = functions.map(fun => ({
    ...fun,
    isSelected: selectedFunctionUid === fun.uid,
  }));

  const handleSelectedFunction = useCallback(
    (fun: OsparcFunction | undefined) => {
      setSelectedFunction(fun);
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
    },
    [
      clearSampling,
      setFetchedJobCollections,
      setGridSamplingConfig,
      setInputVars,
      setLhsSamplingConfig,
      setSelectedFunction,
      setSelectedJobUids,
      setSingleJobConfig,
    ],
  );

  const syncFunctionSelection = useCallback(
    (fun: OsparcFunction | undefined) => {
      if (!fun) {
        handleSelectedFunction(undefined);
        setInputVars([]);
        setOutputVars([]);
        return;
      }

      const inputProperties = fun.inputSchema?.schemaContent?.properties || {};
      const outputProperties = fun.outputSchema?.schemaContent?.properties || {};

      handleSelectedFunction(fun);
      setInputVars(Object.keys(inputProperties));
      setOutputVars(Object.keys(outputProperties));
    },
    [handleSelectedFunction, setInputVars, setOutputVars],
  );

  const fetchJobJobCollectionCount = async (fun: OsparcFunction) => {
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

  const fetchFunctions = async () => {
    let fetchedFunctions: OsparcFunction[] = [];
    try {
      setLoading(true);
      const funs = await listFunctions();
      fetchedFunctions = funs;
      reconcileFunctions(funs);
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
    return fetchedFunctions;
  };

  const showInputOutputSchema = (schema: JSONFunctionInputSchema | JSONFunctionOutputSchema) => {
    if (schema === undefined || schema.schemaContent === undefined || schema.schemaContent.properties === undefined) {
      console.error("Invalid schema:", schema);
      return [];
    }

    const vars = Object.keys(schema.schemaContent.properties);
    return vars.join(", ");
  };

  const getFunctionSolver = (fun: OsparcFunction) => {
    if ((fun as SolverFunction).solverKey) {
      return `${(fun as SolverFunction).solverKey.split("/").slice(-1)[0]}:${(fun as SolverFunction).solverVersion}`;
    }
    if ((fun as ProjectFunction).projectId) {
      const handleInfoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Send a postMessage to the parent iframe
        window.parent.postMessage(
          {
            type: "openFunction",
            message: {
              functionId: (fun as ProjectFunction).projectId,
              uuid: (fun as ProjectFunction).uid,
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
    if ((fun as PythonCodeFunction).codeUrl) {
      return (fun as PythonCodeFunction).codeUrl;
    }
    return "Unknown";
  };

  function setRowSelection(fun: OsparcFunction) {
    if (selectedFunctionUid === fun.uid) {
      syncFunctionSelection(undefined);
      return;
    }

    syncFunctionSelection(fun);
  }

  const handleUploadSuccess = useCallback(
    async (result: UploadJobCollectionSuccessResult) => {
      const fetchedFunctions = await fetchFunctions();
      setDistribution({
        ...distribution,
        [result.targetFunctionUid]: result.inputPresets,
      });
      const uploadedFunction = fetchedFunctions.find(fun => fun.uid === result.targetFunctionUid);
      if (uploadedFunction) {
        syncFunctionSelection(uploadedFunction);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [distribution],
  );

  useEffect(() => {
    (async () => {
      await fetchFunctions();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <Box textAlign="center">
        <Typography variant="body1" fontFamily="inherit" fontSize="1.2em" fontWeight={300} display="inline" mr={1}>
          Error fetching functions from the server. Please try again after some time.
        </Typography>
        <IconButton size="small" onClick={async () => fetchFunctions()}>
          <Refresh color="primary" />
        </IconButton>
      </Box>
    );
  }

  if (!loading && functions.length === 0) {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" justifyContent="flex-end">
          <UploadJobCollectionButton
            buttonLabel="Upload Data"
            buttonTestId="setup-upload-data-btn"
            confirmTestId="setup-confirm-upload-btn"
            variant="contained"
            size="medium"
            allowExistingTarget={false}
            defaultMode="new"
            initialNewFunctionTitle=""
            onUploadSuccess={handleUploadSuccess}
          />
        </Box>
        <Box textAlign="center">
          <Typography variant="body1" fontFamily="inherit" fontSize="1.2em" fontWeight={300} display="inline" mr={1}>
            <HelpContents type="FunctionsHelp" />
          </Typography>
        </Box>
      </Box>
    );
  }
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" justifyContent="flex-end">
        <UploadJobCollectionButton
          buttonLabel="Upload Data"
          buttonTestId="setup-upload-data-btn"
          confirmTestId="setup-confirm-upload-btn"
          variant="contained"
          size="medium"
          allowExistingTarget={false}
          defaultMode="new"
          initialNewFunctionTitle=""
          onUploadSuccess={handleUploadSuccess}
        />
      </Box>
      <TableContainer
        sx={{
          borderRadius: "8px",
          overflow: "hidden",
          fontFamily: "inherit",
          padding: "0px 8px",
          backgroundColor: theme => theme.palette.background.default,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Inputs</TableCell>
              <TableCell>Outputs</TableCell>
              <TableCell># Campaigns / Evaluations</TableCell>
              <TableCell align="center">Further Info</TableCell>
              <TableCell align="right">
                <IconButton
                  sx={theme => ({
                    padding: "8px",
                    color: theme.palette.primary.contrastText,
                  })}
                  onClick={async () => {
                    setLoading(true);
                    await fetchFunctions();
                  }}
                >
                  <Refresh />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && functionRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>Loading...</TableCell>
              </TableRow>
            ) : (
              functionRows.map(fun => (
                <TableRow
                  key={fun.uid || `${fun.title}${fun.description}`}
                  hover
                  sx={{
                    backgroundColor: theme =>
                      fun.isSelected
                        ? `color-mix(in srgb, ${theme.palette.primary.main} 70%, ${theme.palette.mode === "dark" ? "black" : "white"})`
                        : "inherit",
                  }}
                >
                  <TableCell>{fun.title}</TableCell>
                  <TableCell>{fun.description}</TableCell>
                  <TableCell>{showInputOutputSchema(fun.inputSchema)}</TableCell>
                  <TableCell>{showInputOutputSchema(fun.outputSchema)}</TableCell>
                  <TableCell>
                    <NFunctionJobCollections fun={fun} jobCollectionCount={jobCollectionCount} jobCount={jobCount} />
                  </TableCell>
                  <TableCell align="center">{getFunctionSolver(fun)}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      onClick={() => setRowSelection(fun)}
                      mmux-testid={`select-function-btn-${fun.uid}`}
                    >
                      {fun.isSelected ? "Unselect" : "Select"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
