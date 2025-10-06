import { Box, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { fetchWithRetry } from "../../utils/fetch_retry";
import { JobsLoading } from "../data/JobsLoading";
import CalculatingWarning from "./CalculatingWarning";
import HistogramStats from "./HistogramStats";
import InsufficientDataWarning from "./InsufficientDataWarning";

export default function UncertainUQ(props: LoadingPropsType) {
  const { loading, progress, jobProgress } = props;
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [dataUQHistogram, setDataUQHistogram] = useState<DataUQHistogramType>();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [propagating, setPropagating] = useState(false);

  useEffect(() => {
    (async () => {
      console.log("running job collections: ", filteredJobList);
      setDataUQHistogram(undefined);
      setPlotData([]);
      setPropagating(true);
      if (filteredJobList.length === 0) {
        console.warn("No jobs selected for UQ propagation.");
        setPropagating(false);
        return;
      }
      try {
        console.info("Propagating UQ...");
        console.info("SelectedQoI: ", selectedQoI);
        const response = await fetchWithRetry(`${PYTHON_DAKOTA_BACKEND}/flask/manual_uq_propagation_with_uncertainty`, {
          method: "POST",
          body: JSON.stringify({
            inputVars,
            output: selectedQoI,
            distributions: distribution[selectedFunction?.uid || ""],
            FunctionJobs: filteredJobList,
            numSamples: numSamples[selectedFunction?.uid || ""] || 10000,
            log: false,
            nHistograms: 50,
            seed: 0,
          }),
        });
        if (!response.ok) {
          throw new Error(`Error in UQ response: ${response.status}, ${response.statusText}`);
        }
        const data: DataUQHistogramType = await response.json();
        const newPlotData: Plotly.Data[] = [
          {
            x: Array.from(
              { length: data.bin_means.length },
              (_, i) => data.bins_start + ((data.bins_end - data.bins_start) / data.bin_means.length) * (i + 0.5),
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
        ];
        setPlotData(newPlotData);
        setDataUQHistogram(data); // now this is a dict w "mean_histogram" and "std_histogram" keys
        setPropagating(false);
      } catch (error) {
        console.warn("Error:", error);
        setPropagating(false);
        setDataUQHistogram(undefined);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredJobList, selectedQoI, numSamples, inputVars, distribution, selectedFunction]);
  if (loading) {
    return <JobsLoading progress={progress} jobProgress={jobProgress} message="Creating AI model..." />;
  }

  const layout = {
    title: { text: "Uncertainty Quantification Histogram" },
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

  return (
    <Box display="flex" flexDirection="column" gap={1} width="100%">
      {propagating && <CalculatingWarning height={plotStyle.height} dontShowText={plotData.length !== 0} />}
      {!propagating && plotData.length === 0 && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={plotStyle.height}
        />
      )}
      {!propagating && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}
      {dataUQHistogram !== undefined && <HistogramStats {...dataUQHistogram} />}
    </Box>
  );
}
