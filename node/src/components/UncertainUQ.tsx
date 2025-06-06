import { useState, useEffect } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import Plot from "react-plotly.js";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import { Typography, Box, LinearProgress, useTheme } from "@mui/material";

export default function UncertainUQ(props: UncertainUQPropsType) {
  const {
    numSamples,
    loading,
    progress,
    jobProgress,
    colsFetched,
    jobsFetched,
  } = props;
  const { inputVars, selectedQoI, distribution, selectedFunction, fetchedJobCollections, filterSelectedJobList } =useMMUXContext();

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
        try {
          const response = await fetch(
            PYTHON_DAKOTA_BACKEND +
              "/flask/manual_uq_propagation_with_uncertainty",
            {
              method: "POST",
              body: JSON.stringify({
                inputVars: inputVars,
                output: selectedQoI,
                distributions: distribution[selectedFunction?.uid || ""],
                FunctionJobs: jobs,
                numSamples: numSamples,
                log: false,
                nHistograms: 50,
              }),
            }
          )
          const data: dataUQHistogramType = await response.json();
          console.log("UQ Data:", data);
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
  }, [numSamples, filterSelectedJobList, inputVars, distribution, selectedQoI]);

  if (loading) {
    console.info(
      "Loading job collections...",
      colsFetched.current,
      jobsFetched.current
    );
    return (
      <Box
        width={"100%"}
        height={"400px"}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        bgcolor={theme.palette.background.default}
        borderRadius={"8px"}
      >
        <Typography
          variant="body1"
          fontFamily={"inherit"}
          fontWeight={100}
          textAlign={"center"}
          mb={1}
        >
          Creating Uncertainty Quantification AI model...
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <LinearProgress
            variant="buffer"
            value={progress}
            valueBuffer={jobProgress}
            sx={{ height: "6px", width: "40%" }}
          />
        </Box>
        <Typography
          variant="body1"
          fontFamily={"inherit"}
          fontWeight={100}
          textAlign={"center"}
          mt={1}
        >
          <span>{Math.round(jobProgress)}%</span>
        </Typography>
      </Box>
    );
  }

  if (propagating) {
    return (
      <Box
        width={"100%"}
        height={"400px"}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        bgcolor={theme.palette.background.default}
        borderRadius={"8px"}
      >
        <Typography
          variant="body1"
          fontFamily={"inherit"}
          fontWeight={100}
          textAlign={"center"}
        >
          Calculating
        </Typography>
      </Box>
    );
  }

  if (!dataUQHistogram) {
    return (
      <Box
        width={"100%"}
        height={"400px"}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        bgcolor={theme.palette.background.default}
        borderRadius={"8px"}
      >
        <Typography
          variant="body1"
          fontFamily={"inherit"}
          fontWeight={100}
          textAlign={"center"}
        >
          {fetchedJobCollections.length > 0 ? 'No data selected' : 'No data available. Please create more Jobs.'}
        </Typography>
      </Box>
    );
  }

  return (
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
        yaxis: { title: { text: "Frequency" } },
        plot_bgcolor: `${theme.palette.background.default}`,
        paper_bgcolor: `${theme.palette.background.default}`,
        font: { color: `${theme.palette.text.primary}` },
      }}
      style={{ width: "100%", height: "400px", borderRadius: "8px", overflow: "hidden" }}
      config={{ responsive: true }}
    />
  );
}
