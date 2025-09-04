import { useEffect, useState, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import Plot from "react-plotly.js";
import { JobsLoading } from "../data/JobsLoading";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { FunctionJob } from "../../osparc-api-ts-client";
import MogaParetoTable from "./MOGAParetoTable";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { fetchWithRetry } from "../../utils/fetch_retry";
import { aggregateOutputValues } from "../../utils/function_utils";

export function MOGAPareto(props: MogaParetoPropsType) {
  const { loading, progress, jobProgress } = props;
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputTargets } = useFunctionContext();
  const { fetchedJobCollections, filterSelectedJobList } = useJobContext();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [propagating, setPropagating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [outputVarSelection, setOutputVarSelection] = useState<OutputVarSelection>({});
  const [optVars, setOptVars] = useState<Array<string>>([]);
  const [tableData, setTableData] = useState<MogaDataType | undefined>(undefined);

  const runMOGA = useCallback(
    async (jobs: FunctionJob[], ovs: OutputVarSelection) => {
      const bodyData = JSON.stringify({
        inputVars,
        outputVarSelection: ovs,
        distributions: distribution[selectedFunction?.uid || ""],
        FunctionJobs: jobs,
      });
      console.info("Running MOGA...", bodyData);
      const response = await fetchWithRetry(`${PYTHON_DAKOTA_BACKEND}/flask/perform_moga_optimization`, {
        method: "POST",
        body: bodyData,
      });
      if (!response.ok) {
        throw new Error(`Error in MOGA response: ${response.status}, ${response.statusText}`);
      }

      const results: { [key: string]: number[] } = await response.json();
      console.log("MOGA results:", results);

      // set table data
      const newTableData: MogaDataType = {
        inputs: inputVars,
        outputs: optVars,
        rows: results.non_dominated_indices.map((ndi: number) => ({
          ...optVars.map(v => ({ [v]: results[v][ndi] })).reduce((a, b) => ({ ...a, ...b }), {}),
          Performance: 0,
          NDI: ndi,
        })),
      };
      setTableData(newTableData);

      const outputValues = aggregateOutputValues(jobs);

      const newPlotData: Plotly.Data[] = [
        {
          name: "Original Samples",
          x: outputValues[optVars[0]],
          y: outputValues[optVars[1]], // TODO enable selection, when more than 2
          mode: "markers",
          type: "scatter",
          marker: { color: "rgb(41, 146, 221)", size: 4, symbol: "x" },
        },
        {
          name: "MOGA Samples",
          x: results[optVars[0]],
          y: results[optVars[1]],
          mode: "markers",
          type: "scatter",
          marker: { color: "rgb(255, 127, 14)", size: 2 },
        },
        {
          name: "Pareto Samples",
          x: results.non_dominated_indices.map(i => results[optVars[0]][i]),
          y: results.non_dominated_indices.map(i => results[optVars[1]][i]),
          mode: "lines",
          type: "scatter",
          marker: { color: "lightblue", size: 10 },
        },
      ];
      setPlotData(newPlotData);
      setPropagating(false);
    },
    [inputVars, distribution, selectedFunction, optVars],
  );

  useEffect(() => {
    if (!selectedFunction) {
      console.warn("No function selected!!");
    } else {
      console.debug("Information about optimization vars fetched");
      setOptVars(Object.keys(outputTargets[selectedFunction?.uid as string]));
      setOutputVarSelection(outputTargets[selectedFunction.uid]);

      const run = async () => {
        const jobs = filterSelectedJobList();
        if (jobs.length === 0) {
          console.warn("No jobs selected for MOGA Pareto plot.");
          return;
        }
        try {
          setPropagating(true);
          console.info("Fetching MOGA Pareto data...");
          await runMOGA(jobs, outputTargets[selectedFunction.uid]);
        } catch (error) {
          console.error("Error fetching MOGA Pareto data:", error);
        }
        setPropagating(false);
      };
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction, outputTargets]);

  const layout = {
    title: { text: "Pareto Front Diagram" },
    xaxis: { title: { text: optVars[0] } },
    yaxis: { title: { text: optVars[1] } },
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
  };

  const plotStyle = {
    width: "100%",
    height: 400,
    borderRadius: "8px",
    overflow: "hidden",
  };

  if (loading) {
    return <JobsLoading progress={progress} jobProgress={jobProgress} message="Creating AI model..." />;
  }

  return (
    <Box display="flex" flexDirection="column" gap={1} width="100%">
      {propagating && <CalculatingWarning height={plotStyle.height} dontShowText={plotData.length !== 0} />}
      {!propagating && plotData.length === 0 && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filterSelectedJobList={filterSelectedJobList}
          height={plotStyle.height}
        />
      )}
      {!propagating && plotData.length !== 0 && (
        <>
          <Plot data={plotData} layout={layout} style={plotStyle} />
          <MogaParetoTable tableData={tableData} />
          {/* TODO still need to implement real data in there */}
        </>
      )}
    </Box>
  );
}
