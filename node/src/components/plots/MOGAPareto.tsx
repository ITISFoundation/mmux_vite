import React, { useEffect, useState } from "react";
import { Box, useTheme } from "@mui/material";
import { JobsLoading } from "../data/JobsLoading";
import Plot from "react-plotly.js";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { FunctionJob } from "../../osparc-api-ts-client";
import MogaParetoTable from "./MOGAParetoTable";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { fetchWithRetry } from "../../utils/fetch_retry";

export const MOGAPareto = (props: MogaParetoPropsType) => {
  const { loading, progress, jobProgress, colsFetched: _colsFetched, jobsFetched: _jobsFetched } = props;
  const theme = useTheme();
  const { selectedFunction: _selectedFunction, inputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filterSelectedJobList } = useJobContext();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [propagating, setPropagating] = useState(false);

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      if (jobs.length === 0) {
        console.warn("No jobs selected for MOGA Pareto plot.");
        return;
      }
      setPropagating(true);
      try {
        console.info("Fetching MOGA Pareto data...");
        // Simulate fetching data
        await runMOGA(jobs);
      } catch (error) {
        console.error("Error fetching MOGA Pareto data:", error);
      } finally {
        setPropagating(false);
      }
    };
    run();
  }, [filterSelectedJobList, selectedQoI, numSamples, inputVars, distribution]);

  const runMOGA = async (jobs: FunctionJob[]) => {
    console.info("Propagating UQ...");
    console.info("SelectedQoI: ", selectedQoI);
    const response = await fetchWithRetry(
      PYTHON_DAKOTA_BACKEND +
      "/flask/perform_moga_optimization",
      {
        method: "POST",
        body: JSON.stringify({
          inputVars: inputVars,
          outputs: inputVars, // TODO implement way to select min, max, or none
          FunctionJobs: jobs,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Error in MOGA response: ${response.status}, ${response.statusText}`
      );
    }

    interface MogaResponse {
      results: { [key: string]: number[] };
      non_dominated_indices: number[];
    }
    const { results, non_dominated_indices } = await response.json() as MogaResponse;

    const newPlotData: Plotly.Data[] = [
      {
        name: "MOGA Samples",
        x: results[inputVars[0]],
        y: results[inputVars[1]],
        mode: "lines",
        type: "scatter",
        marker: { color: "green", size: 10 },
      },
      {
        name: "Pareto Samples",
        x: non_dominated_indices.map(i => results[inputVars[0]][i]),
        y: non_dominated_indices.map(i => results[inputVars[1]][i]),
        mode: "markers",
        type: "scatter",
        marker: { color: "lightblue", size: 10 },
      }
    ];
    setPlotData(newPlotData);
    setPropagating(false);
  };

  const layout = {
    title: { text: "Pareto Front Diagram" },
    xaxis: { title: { text: inputVars[0] } },
    yaxis: { title: { text: inputVars[1] } },
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
    return (
      <JobsLoading
        progress={progress}
        jobProgress={jobProgress}
        message={"Creating AI model..."}
      />
    );
  }

  return (
    <Box display={"flex"} flexDirection={"column"} gap={1} width={"100%"}>
      {propagating && (
        <CalculatingWarning
          height={plotStyle.height}
          dontShowText={plotData.length !== 0}
        />
      )}
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
          <MogaParetoTable />
          {/* TODO still need to implement real data in there */}
        </>
      )}
    </Box>
  );
};
