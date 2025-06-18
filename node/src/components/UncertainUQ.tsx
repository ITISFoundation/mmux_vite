import { useState, useEffect } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import Plot from "react-plotly.js";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import { Box, useTheme } from "@mui/material";
import { fetchWithRetry } from "../utils/fetch_retry";
import WhiskerPlot from "./WhiskerPlot";
import HistogramStats from "./HistogramStats";
import { JobsLoading } from "./JobsLoading";
import { DisplayMessage } from "./DisplayMessage";

export default function UncertainUQ(props: UncertainUQPropsType) {
  const {
    loading,
    progress,
    jobProgress,
    colsFetched,
    jobsFetched,
  } = props;
  const { numSamples, inputVars, selectedQoI, distribution, selectedFunction, fetchedJobCollections, filterSelectedJobList } = useMMUXContext();

  const theme = useTheme();
  const [dataUQHistogram, setDataUQHistogram] = useState<dataUQHistogramType>();
  const [propagating, setPropagating] = useState(false);

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();

      async function runUQ(jobs: FunctionJob[]) {
        console.log("Running UQ...");
        setDataUQHistogram(undefined);
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
                numSamples: numSamples[selectedFunction?.uid || ""] || 1000,
                log: false,
                nHistograms: 50,
              }),
            }
          )
          if (!response.ok) {
            throw new Error(`Error in UQ response: ${response.status}, ${response.statusText}`);
          }
          const data: dataUQHistogramType = await response.json();
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
    console.info(
      "Loading job collections...",
      colsFetched.current,
      jobsFetched.current
    );
    return (
      <JobsLoading
        progress={progress}
        jobProgress={jobProgress}
        message={"Creating Uncertainty Quantification AI model..."}
      />
    )
  } else if (propagating) {
    return (
      <DisplayMessage mssg={"Calculating..."} />
    )
  } else if (dataUQHistogram === undefined) {
    // loading is off, propagating is off.
    // The data we have is fetchedJobCollections (e.g. whether there is data available at all),
    // dataUQHistogram (whether we managed to retrieve any data) and propagationFailed (whether we got an error during propagation)
    // I guess the later is redundant - we can already use dataUQHistogram to know if the propagation failed
    return (
      <DisplayMessage mssg={fetchedJobCollections.length === 0
        ? 'No data available. Please create more Jobs.'
        : filterSelectedJobList().length === 0 ? 'No data selected'
          : "Error propagating uncertainty, please contact support."
      }
      />
    );
  } else {
    return (
      <>
        {(dataUQHistogram !== undefined) &&
          <Box display={'flex'} flexDirection={'column'} gap={1} width={'100%'}>
            <Plot
              data={[
                {
                  x: Array.from(
                    { length: dataUQHistogram.bin_means.length },
                    (_, i) =>
                      dataUQHistogram.bins_start +
                      ((dataUQHistogram.bins_end - dataUQHistogram.bins_start) /
                        dataUQHistogram.bin_means.length) *
                      (i + 0.5)
                  ),
                  y: dataUQHistogram.bin_means,
                  type: "bar",
                  marker: { color: `${theme.palette.primary.main}` },
                  name: "UQ Histogram",
                  error_y: {
                    type: "data",
                    array: dataUQHistogram.bin_stds,
                    visible: true,
                  },
                },
              ]}
              layout={{
                title: { text: "Uncertainty Quantification Histogram" },
                xaxis: { title: { text: selectedQoI || "Output" } },
                yaxis: { title: { text: "Density" } },
                plot_bgcolor: `${theme.palette.background.default}`,
                paper_bgcolor: `${theme.palette.background.default}`,
                font: { color: `${theme.palette.text.primary}` },
              }}
              style={{ width: "100%", height: "400px", borderRadius: "8px", overflow: "hidden" }}
              config={{ responsive: true }}
            />
            <WhiskerPlot {...dataUQHistogram} />
            <HistogramStats {...dataUQHistogram} />
          </Box>
        }
      </>


    )
  }
}
