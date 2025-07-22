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
import MogaParetoTable from "./MogaParetoTable";

export const MoGaPareto = (props: MogaParetoPropsType) => {
  const { loading, progress, jobProgress, colsFetched, jobsFetched } = props;
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filterSelectedJobList } = useJobContext();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [propagating, setPropagating] = useState(false);

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      if (jobs.length === 0) {
        console.warn("No jobs selected for MoGa Pareto plot.");
        return;
      }
      setPropagating(true);
      try {
        console.info("Fetching MoGa Pareto data...");
        // Simulate fetching data
        await runMoGa(jobs);
      } catch (error) {
        console.error("Error fetching MoGa Pareto data:", error);
      } finally {
        setPropagating(false);
      }
    };
    run();
  }, [filterSelectedJobList, selectedQoI, numSamples, inputVars, distribution]);

  const runMoGa = async (jobs: FunctionJob[]) => {
    setPropagating(true);
    // Simulate fetching data and processing it
    const data = await new Promise<Plotly.Data[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            x: jobs.map(job => job[selectedQoI as keyof FunctionJob]),
            type: "histogram",
            histnorm: "probability density",
          },
        ]);
      }, 2000);
    });
    setPlotData(data);
    setPropagating(false);
  };

  const layout = {
    title: { text: "Pareto front Diagram" },
    xaxis: { title: { text: selectedQoI || "Output" } },
    yaxis: { title: { text: "Density" } },
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
        </>
      )}
    </Box>
  );
};
