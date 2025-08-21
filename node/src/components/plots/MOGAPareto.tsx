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
import { Result } from "postcss";

export const MOGAPareto = (props: MogaParetoPropsType) => {
  const { loading, progress, jobProgress, colsFetched: _colsFetched, jobsFetched: _jobsFetched } = props;
  const theme = useTheme();
  const { selectedFunction, inputVars, outputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filterSelectedJobList } = useJobContext();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [propagating, setPropagating] = useState(false);

  const minimize_var_1 = outputVars[7] // isop50
  const minimize_var_2 = outputVars[11] // shannon50

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
        await runMOGA(jobs);
      } catch (error) {
        console.error("Error fetching MOGA Pareto data:", error);
      } finally {
        setPropagating(false);
      }
    };
    run();
  }, [filterSelectedJobList, selectedQoI, numSamples, inputVars, outputVars, distribution]);

  const runMOGA = async (jobs: FunctionJob[]) => {
    console.info("Running MOGA...");
    const response = await fetchWithRetry(
      PYTHON_DAKOTA_BACKEND +
      "/flask/perform_moga_optimization",
      {
        method: "POST",
        body: JSON.stringify({
          inputVars: inputVars,
          outputVars: [minimize_var_1, minimize_var_2], // TODO implement way to select min, max, or none
          distributions: distribution[selectedFunction?.uid || ""],
          FunctionJobs: jobs,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Error in MOGA response: ${response.status}, ${response.statusText}`
      );
    }

    const results: { [key: string]: number[] } = await response.json()
    console.log("results MOGA: ", results)

    const newPlotData: Plotly.Data[] = [
      {
        name: "MOGA Samples",
        x: results[minimize_var_1],
        y: results[minimize_var_2],
        mode: "markers",
        type: "scatter",
        marker: { color: "green", size: 3 },
      },
      {
        name: "Pareto Samples",
        x: results["non_dominated_indices"].map(i => results[minimize_var_1][i]),
        y: results["non_dominated_indices"].map(i => results[minimize_var_2][i]),
        mode: "lines",
        type: "scatter",
        marker: { color: "lightblue", size: 10 },
      }
      // TODO add the true sample points (jobs) for comparison
    ];
    setPlotData(newPlotData);
    setPropagating(false);
  };

  const layout = {
    title: { text: "Pareto Front Diagram" },
    xaxis: { title: { text: minimize_var_1 } },
    yaxis: { title: { text: minimize_var_2 } },
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
