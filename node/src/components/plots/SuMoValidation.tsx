import { useState, useEffect, useRef } from "react";
import { Alert, Box, useTheme } from "@mui/material";
import Plot from "react-plotly.js";
import { Layout } from "plotly.js";
import { OsparcFunctionJob } from "../../context/types";
import { useMMUXContext } from "../../context/MMUXContext";
import Metric from "./Metric";
import MetricRow from "./MetricRow";
import { plotMarginsNarrow } from "./PlotTools";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { buildDakotaRequestKey } from "../../utils/dakotaRequestKey";
import {
  computeCvStatistics,
  CvConvergencePoint,
  formatBiasBanner,
  PairedTTestResult,
  SumoCvAccuracyMetricsResponse,
} from "../../utils/sumoCvAccuracy";

function SuMoValidation() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [cvMetrics, setCvMetrics] = useState<CvMetricsType>();
  const [plotData, setPlotData] = useState<Partial<Plotly.ViolinData>[]>([]);
  const [propagating, setPropagating] = useState(false);
  const [tTest, setTTest] = useState<PairedTTestResult>();
  const [convergence, setConvergence] = useState<CvConvergencePoint[]>([]);
  const lastFetchedCvAccuracyKey = useRef<string | undefined>(undefined);
  const [width, setWidth] = useState(1080);
  const boxRef = useRef<HTMLDivElement>(null);

  function computeStatisticsCv(y: number[], yHat: number[]) {
    setCvMetrics(computeCvStatistics(y, yHat));
  }

  const createDataAndMetrics = (data: { [key: string]: number[] }) => {
    if (data && selectedQoI) {
      const y = data[selectedQoI];
      // The backend builds the prediction key as `<output>_hat`, but the global
      // after_request serializer camelCases every response key, so the client
      // receives `<selectedQoI>Hat` (e.g. `yHat`). Read the camelCase key.
      const yHat = data[`${selectedQoI}Hat`];

      // For violin plots, y should be the data and x should be the label
      const createViolinPlot = (
        localData: number[],
        name: string,
        side: "positive" | "negative",
      ): Partial<Plotly.ViolinData> => ({
        x: localData,
        y: Array(localData.length).fill(""), // Use same x value to overlay
        orientation: "h",
        type: "violin",
        name,
        pointpos: side === "positive" ? 1 : -1,
        points: "all",
        side,
        box: {
          visible: true,
        },
        spanmode: "soft", // TODO show Esra both variants
      });
      const newPlotData: Partial<Plotly.ViolinData>[] = [
        createViolinPlot(y, "Observations", "positive"),
        createViolinPlot(yHat, "Predictions", "negative"),
      ];
      setPlotData(newPlotData);
      computeStatisticsCv(y, yHat);
    } else {
      console.warn("No data available for SuMo validation.");
      setPlotData([]);
      setCvMetrics(undefined);
    }
  };

  const RunSuMoValidation = async (jobs: OsparcFunctionJob[]) => {
    console.info("Evaluating SuMo Validation for jobs: ", jobs);

    if (!jobs || jobs.length < 5) {
      setCvMetrics(undefined);
      setPlotData([]);
      setPropagating(false);
      return;
    }

    setCvMetrics(undefined);
    setPlotData([]);
    setPropagating(true);

    fetch(`/flask/dakota/sumo_cross_validation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputVars,
        output: selectedQoI,
        FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
        log: false,
      }),
    })
      .then(response => response.json())
      .then(response => {
        if (!response || (response && response.error)) {
          console.warn("SuMo Validation error: ", response.error);
          throw new Error(`Error running SuMo Validation: ${response.error}`);
        } else {
          const data = response;
          createDataAndMetrics(data);
          setPropagating(false);
        }
      })
      .catch(error => {
        console.warn("Error:", error);
        setPropagating(false);
        setPlotData([]);
        setCvMetrics(undefined);
      });
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filteredJobList;
      return RunSuMoValidation(jobs);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQoI, inputVars, selectedFunction, distribution, filteredJobList]);

  // V25 (../flaskapi/SPEC.md V26/V27): paired t-test bias banner + convergence curve,
  // fetched from the (now populated) `/get_sumo_cv_accuracy_metrics` endpoint alongside
  // the existing MAE/RMSE + CV scatter above.
  const RunCvAccuracyMetrics = async (jobs: OsparcFunctionJob[], requestKey: string) => {
    fetch(`/flask/dakota/get_sumo_cv_accuracy_metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: inputVars,
        output: selectedQoI,
        FunctionJobs: jobs,
      }),
    })
      .then(response => {
        if (response && !response.ok) {
          // V18/V23-style: reject (⊥ resolve) so .catch clears lastFetchedCvAccuracyKey
          // and identical inputs can be retried instead of caching a failed fetch.
          return Promise.reject(
            new Error(`SuMo CV accuracy metrics response not ok: ${response.status}, ${response.statusText}`),
          );
        }
        return response.json();
      })
      .then((data: SumoCvAccuracyMetricsResponse) => {
        if (!data || data.error) {
          return Promise.reject(new Error(`Error fetching SuMo CV accuracy metrics: ${data?.error}`));
        }
        setTTest(data.tTest);
        setConvergence(data.convergence || []);
        lastFetchedCvAccuracyKey.current = requestKey;
        return undefined;
      })
      .catch(error => {
        console.warn("Error fetching SuMo CV accuracy metrics:", error);
        lastFetchedCvAccuracyKey.current = undefined;
        setTTest(undefined);
        setConvergence([]);
      });
  };

  useEffect(() => {
    const jobs = filteredJobList;
    if (!jobs || jobs.length < 5 || !selectedQoI) {
      lastFetchedCvAccuracyKey.current = undefined;
      setTTest(undefined);
      setConvergence([]);
      return;
    }
    // V16-style: dedup by stable logical request key; same key → no new fetch.
    const requestKey = buildDakotaRequestKey({
      axes: inputVars,
      sliderValues: {},
      qoi: selectedQoI,
      fn: selectedFunction?.uid,
      jobList: jobs.map(job => job.uid),
      logScale: false,
    });
    if (requestKey === lastFetchedCvAccuracyKey.current) {
      return;
    }
    RunCvAccuracyMetrics(jobs, requestKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQoI, inputVars, selectedFunction, distribution, filteredJobList]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(event => {
      // Depending on the layout, you may need to swap inlineSize with blockSize
      // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/contentBoxSize
      setWidth(event[0].contentBoxSize[0].inlineSize);
    });

    if (boxRef.current) {
      resizeObserver.observe(boxRef.current);
    }
  }, [boxRef]);

  const layout: Partial<Layout> = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    title: {
      text: `${selectedQoI || "Quantity of Interest"} Sample Distribution`,
    },
    margin: plotMarginsNarrow,
    width,
    barmode: "overlay",
    legend: {
      x: 1,
      xanchor: "right",
      y: 1,
      bgcolor: "rgba(0,0,0,0)",
    },
  };

  const plotStyle = {
    height: 400,
    borderRadius: "8px",
    overflow: "hidden",
    margin: "0 auto", // Center the plot horizontally
    maxWidth: `${width}px`, // Match the width of the statistics box below
  };

  const biasBanner = formatBiasBanner(tTest);

  const convergenceLayout: Partial<Layout> = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    title: { text: "CV Accuracy Convergence" },
    margin: plotMarginsNarrow,
    width,
    xaxis: { title: { text: "Training samples (N)" } },
    yaxis: { title: { text: "RMSE" } },
  };

  const convergencePlotData: Partial<Plotly.ScatterData>[] = [
    {
      x: convergence.map(point => point.nSamples),
      y: convergence.map(point => point.metric),
      type: "scatter",
      mode: "lines+markers",
      name: "RMSE vs N",
    },
  ];

  return (
    <Box
      display="flex"
      flex={1}
      flexDirection="column"
      width="100%"
      justifyContent="center"
      ref={boxRef}
      mmux-testid="sumo-validation-view"
    >
      {propagating && <CalculatingWarning height={plotStyle.height} dontShowText />}
      {!propagating && plotData.length === 0 && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={plotStyle.height}
        />
      )}
      {!propagating && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}

      {cvMetrics ? (
        <Box display="flex" flexDirection="row" flex={1} justifyContent="space-around" mt={4}>
          <MetricRow width={width}>
            <Metric metricName="Mean" metricValue={cvMetrics.meanY} color="rgb(41, 146, 221)" />
            <Metric metricName="Std" metricValue={cvMetrics.stdY} color="rgb(41, 146, 221)" />
            {/* rgb(31, 119, 180) is the original; changed it slightly to improve visibility */}
          </MetricRow>
          <MetricRow width={width}>
            <Metric metricName="Mean" metricValue={cvMetrics.meanYHat} color="rgb(255, 127, 14)" />
            <Metric metricName="Std" metricValue={cvMetrics.stdYHat} color="rgb(255, 127, 14)" />
          </MetricRow>
        </Box>
      ) : (
        <div />
      )}

      {biasBanner && (
        <Box mt={2} mmux-testid="sumo-cv-bias-banner">
          <Alert severity={biasBanner.significant ? "warning" : "success"}>{biasBanner.text}</Alert>
        </Box>
      )}

      {convergence.length > 0 && (
        <Box mt={4} mmux-testid="sumo-cv-convergence-plot">
          <Plot data={convergencePlotData} layout={convergenceLayout} style={plotStyle} />
        </Box>
      )}
    </Box>
  );
}

export default SuMoValidation;
