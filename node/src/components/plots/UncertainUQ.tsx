import { Box, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import { fetchWithRetry } from "../../utils/fetchRetry";
import { JobsLoading } from "../data/JobsLoading";
import CalculatingWarning from "./CalculatingWarning";
import HistogramStats from "./HistogramStats";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { getUQHistogramData } from "./sumoResponse";

type ErrorResponseBody = {
  error?: string;
  details?: string[];
};

export default function UncertainUQ(props: LoadingPropsType) {
  const { loading, jobProgress } = props;
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [dataUQHistogram, setDataUQHistogram] = useState<DataUQHistogramType>();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [propagating, setPropagating] = useState(false);
  const [calculationError, setCalculationError] = useState<string>();

  useEffect(() => {
    (async () => {
      console.log("running job collections: ", filteredJobList);
      setDataUQHistogram(undefined);
      setPlotData([]);
      setCalculationError(undefined);
      setPropagating(true);
      if (filteredJobList.length === 0) {
        console.warn("No jobs selected for UQ propagation.");
        setPropagating(false);
        return;
      }
      if (!selectedQoI) {
        setCalculationError("Select a quantity of interest to run uncertainty-aware UQ.");
        setPropagating(false);
        return;
      }
      try {
        console.info("Propagating UQ...");
        console.info("SelectedQoI: ", selectedQoI);
        const response = await fetchWithRetry(`/flask/dakota/manual_uq_propagation_with_uncertainty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          let errorMessage = `Error in UQ response: ${response.status}, ${response.statusText}`;
          const contentType = response.headers.get("content-type") || "";

          if (contentType.includes("application/json")) {
            const errorPayload = (await response.json()) as ErrorResponseBody;
            errorMessage = errorPayload.details?.[0] || errorPayload.error || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText.trim()) {
              errorMessage = errorText.trim();
            }
          }

          throw new Error(errorMessage);
        }
        const data = getUQHistogramData(await response.json());
        if (!data) {
          throw new Error("Unexpected UQ histogram payload shape");
        }
        const newPlotData: Plotly.Data[] = [
          {
            x: Array.from(
              { length: data.binMeans.length },
              (_, i) => data.binsStart + ((data.binsEnd - data.binsStart) / data.binMeans.length) * (i + 0.5),
            ),
            y: data.binMeans,
            type: "bar",
            marker: { color: `${theme.palette.primary.main}` },
            name: "UQ Histogram",
            error_y: {
              type: "data",
              array: data.binStds,
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
        setCalculationError(error instanceof Error ? error.message : "Error during calculation, please contact support.");
      }
    })();
  }, [filteredJobList, selectedQoI, numSamples, inputVars, distribution, selectedFunction, theme.palette.primary.main]);
  if (loading) {
    return <JobsLoading jobProgress={jobProgress} message="Creating AI model..." />;
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
          calculationError={calculationError}
        />
      )}
      {!propagating && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}
      {dataUQHistogram !== undefined && <HistogramStats {...dataUQHistogram} />}
    </Box>
  );
}
