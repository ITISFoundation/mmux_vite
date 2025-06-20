import { useState, useEffect } from "react";
import { useMMUXContext } from "../../context/MMUXContext";
import { FunctionJob } from "../../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { Box, useTheme } from "@mui/material";
import { fetchWithRetry } from "../../utils/fetch_retry";
import HistogramStats from "../HistogramStats";
import { JobsLoading } from "../JobsLoading";
import ShowPlotOrWarning from "./ShowPlotOrWarning";

export default function UncertainUQ(props: UncertainUQPropsType) {
  const {
    loading,
    progress,
    jobProgress,
  } = props;
  const plotHeight = 400;
  const theme = useTheme();
  const { numSamples, inputVars, selectedQoI, distribution, selectedFunction, fetchedJobCollections, filterSelectedJobList } = useMMUXContext();
  const [dataUQHistogram, setDataUQHistogram] = useState<dataUQHistogramType>();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [propagating, setPropagating] = useState(false);

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      async function runUQ(jobs: FunctionJob[]) {
        console.log("Running UQ...");
        setDataUQHistogram(undefined);
        setPlotData([])
        setPropagating(true);
        if (jobs.length === 0) {
          console.warn("No jobs selected for UQ propagation.");
          setPropagating(false);
          return;
        }
        try {
          console.info("Propagating UQ...")
          console.info("SelectedQoI: ", selectedQoI)
          const response = await fetchWithRetry(
            PYTHON_DAKOTA_BACKEND +
            "/flask/manual_uq_propagation_with_uncertainty",
            {
              method: "POST",
              body: JSON.stringify({
                inputVars: inputVars,
                output: selectedQoI,
                distributions: distribution[selectedFunction?.uid || ""],
                FunctionJobs: jobs,
                numSamples: numSamples[selectedFunction?.uid || ""] || 10000,
                log: false,
                nHistograms: 50,
              }),
            }
          )
          if (!response.ok) {
            throw new Error(`Error in UQ response: ${response.status}, ${response.statusText}`);
          }
          const data: dataUQHistogramType = await response.json();
          const newPlotData: Plotly.Data[] = [
            {
              x: Array.from(
                { length: data.bin_means.length },
                (_, i) =>
                  data.bins_start +
                  ((data.bins_end - data.bins_start) /
                    data.bin_means.length) *
                  (i + 0.5)
              ),
              y: data.bin_means,
              type: "bar",
              marker: { color: `${theme.palette.primary.main}` },
              name: "UQ Histogram",
              error_y: {
                type: "data",
                array: data.bin_stds,
                visible: true,
              },
            },
          ]
          setPlotData(newPlotData)
          setDataUQHistogram(data); // now this is a dict w "mean_histogram" and "std_histogram" keys
          setPropagating(false);
        } catch (error) {
          console.debug("Error:", error)
          setPropagating(false);
          setDataUQHistogram(undefined);
        }
      }
      return await runUQ(jobs);
    };
    run();
  }, [numSamples, filterSelectedJobList, inputVars, distribution, selectedQoI, selectedFunction?.uid]);
  if (loading) {
    return (
      <JobsLoading
        progress={progress}
        jobProgress={jobProgress}
        message={"Creating AI model..."}
      />
    )
  }

  const layout = {
    title: { text: "Uncertainty Quantification Histogram" },
    xaxis: { title: { text: selectedQoI || "Output" } },
    yaxis: { title: { text: "Density" } },
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
  }
  const plotStyle = { width: "100%", height: plotHeight, borderRadius: "8px", overflow: "hidden" }

  return (
    <Box display={'flex'} flexDirection={'column'} gap={1} width={'100%'}>
      <ShowPlotOrWarning plotData={plotData} plotStyle={plotStyle} layout={layout} calculating={propagating} />
      {(dataUQHistogram !== undefined) &&
        <HistogramStats {...dataUQHistogram} />
      }
    </Box >
  )
}
