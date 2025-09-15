/* eslint-disable no-nested-ternary */
import { useEffect, useState, useCallback, useRef } from "react";
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
import { useMMUXContext } from "../../context/MMUXContext";
import { CustomAnimatedToggle } from "../utils/CustomAnimatedToggle";

export function MOGAPareto(props: MogaParetoPropsType) {
  const { loading, progress, jobProgress } = props;
  const theme = useTheme();
  const ref = useRef<Plot>(null);
  const { selectedFunction, inputVars, distribution, outputTargets } = useFunctionContext();
  const { fetchedJobCollections, filteredJobList, selectedJobUids } = useJobContext();
  const { weights } = useMMUXContext();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [plotType, setPlotType] = useState<"1D" | "2D" | "3D">("2D");
  const [propagating, setPropagating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [outputVarSelection, setOutputVarSelection] = useState<OutputVarSelection>({});
  const [optVars, setOptVars] = useState<Array<string>>([]);
  const [tableData, setTableData] = useState<MogaDataType | undefined>(undefined);
  const [hovered, setHovered] = useState<number | null>(null);

  const calculatePerformance = useCallback(
    (row: { [x: string]: number }) => {
      console.log("performance: ", optVars, weights ? weights[optVars[0]] : "", row[optVars[0]]);
      if (optVars.length === 0 || !weights) return 0;
      let performance = 0;
      for (let i = 0; i < optVars.length; i += 1) {
        const varName = optVars[i];
        performance += weights[varName] * (row[varName] as number);
      }
      performance /= Object.values(weights).reduce((a, b) => a + b, 0);
      return performance;
    },
    [optVars, weights],
  );

  const runMOGA = useCallback(
    async (jobs: FunctionJob[], ovs: OutputVarSelection, extPlotType?: "1D" | "2D" | "3D") => {
      let localOptVars = optVars;
      if (localOptVars.length === 0) {
        console.warn("No optimization variables selected., using output var selection", ovs);
        localOptVars = Object.keys(ovs);
      }
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
      console.log("MOGA results:", localOptVars);
      console.log("MOGA results:", results);

      // set table data
      const newTableData: MogaDataType = {
        inputs: inputVars,
        outputs: localOptVars,
        rows: results.non_dominated_indices.map((ndi: number) => ({
          ...inputVars.map(v => ({ [v]: results[v][ndi] })).reduce((a, b) => ({ ...a, ...b }), {}),
          ...localOptVars.map(v => ({ [v]: results[v][ndi] })).reduce((a, b) => ({ ...a, ...b }), {}),
          Performance: calculatePerformance(
            localOptVars.map(v => ({ [v]: results[v][ndi] })).reduce((a, b) => ({ ...a, ...b }), {}),
          ),
          NDI: ndi,
        })),
      };
      setTableData(newTableData);

      const outputValues = aggregateOutputValues(jobs);
      let localPlotType: "1D" | "2D" | "3D" = localOptVars.length < 2 ? "1D" : "2D";
      localPlotType = localOptVars.length > 2 ? "3D" : localPlotType;
      if (extPlotType) localPlotType = extPlotType;

      const newPlotData: Plotly.Data[] = [
        {
          name: "Sample Points",
          x: outputValues[localOptVars[0]],
          y: localPlotType === "2D" || localPlotType === "3D" ? outputValues[localOptVars[1]] : undefined,
          z: localPlotType === "3D" ? outputValues[localOptVars[2]] : undefined,
          mode: "markers",
          type: localPlotType === "3D" ? "scatter3d" : "scatter",
          marker: { color: "rgb(41, 146, 221)", size: 4, symbol: "x" },
        },
        {
          name: "MOGA Samples",
          x: results[localOptVars[0]],
          y: localPlotType === "2D" || localPlotType === "3D" ? results[localOptVars[1]] : undefined,
          z: localPlotType === "3D" ? results[localOptVars[2]] : undefined,
          mode: "markers",
          type: localPlotType === "3D" ? "scatter3d" : "scatter",
          marker: { color: "rgb(255, 127, 14)", size: 2 },
        },
        {
          name: "Pareto Front",
          x: results.non_dominated_indices.map(i => (results[localOptVars[0]] as Array<number>)[i]),
          y:
            localPlotType === "2D" || localPlotType === "3D"
              ? results.non_dominated_indices.map(i => (results[localOptVars[1]] as Array<number>)[i])
              : undefined,
          z:
            localPlotType === "3D"
              ? results.non_dominated_indices.map(i => (results[localOptVars[2]] as Array<number>)[i])
              : undefined,
          mode: "lines",
          type: localPlotType === "3D" ? "scatter3d" : "scatter",
          marker: { color: "lightblue", size: 10 },
        },
      ];
      setPlotData(newPlotData);
      setPlotType(localPlotType);
      setPropagating(false);
    },
    [optVars, inputVars, distribution, selectedFunction, calculatePerformance],
  );

  useEffect(() => {
    if (!selectedFunction) {
      console.warn("No function selected!!");
    } else {
      console.debug("Information about optimization vars fetched");
      setOptVars(Object.keys(outputTargets[selectedFunction?.uid as string] || {}));
      setOutputVarSelection(outputTargets[selectedFunction.uid]);

      const run = async () => {
        const jobs = filteredJobList;
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
  }, [selectedFunction, outputTargets, weights, selectedJobUids]);

  useEffect(() => {
    if (hovered !== null && tableData) {
      const hoveredRow = tableData.rows.find(r => r.NDI === hovered);
      console.log("hovered row:", hoveredRow);
      if (hoveredRow && optVars.length >= 2) {
        const newPlotData = [...plotData];
        newPlotData[3] = {
          name: "Current Selection",
          mode: "markers",
          type: plotType === "3D" ? "scatter3d" : "scatter",
          marker: { color: "red", size: 10, symbol: "circle" },
          x: [hoveredRow[optVars[0]]],
          y: [hoveredRow[optVars[1]]],
          z: optVars.length > 2 ? [hoveredRow[optVars[2]]] : undefined,
        };
        setPlotData(newPlotData);
      }
    } else {
      const newPlotData = [...plotData];
      if (newPlotData.length > 3) {
        newPlotData.pop();
        setPlotData(newPlotData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, plotType, tableData]);

  const layout = {
    title: { text: "Pareto Front Diagram" },
    xaxis: { title: { text: optVars[0] } },
    yaxis: { title: { text: optVars[1] } },
    zaxis: { title: { text: optVars[2] } },
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
  };

  const plotStyle = {
    width: "100%",
    height: optVars.length > 2 ? 600 : 400,
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
          filteredJobList={filteredJobList}
          height={plotStyle.height}
        />
      )}
      {!propagating && plotData.length !== 0 && (
        <>
          <Plot ref={ref} data={plotData} layout={layout} style={plotStyle} />
          <Box
            sx={{
              width: "150px",
              alignSelf: "flex-end",
              mb: 1,
              backgroundColor: theme.palette.background.default,
              padding: "4px",
              borderRadius: "32px",
            }}
          >
            <CustomAnimatedToggle
              data={["1D", "2D", "3D"]}
              value={plotType === "1D" ? 0 : plotType === "2D" ? 1 : 2}
              onChange={i => {
                const calculatePT = i === 0 ? "1D" : i === 1 ? "2D" : "3D";
                runMOGA(filteredJobList, outputTargets[selectedFunction?.uid as string], calculatePT);
              }}
              disabled={false}
            />
          </Box>
          <MogaParetoTable tableData={tableData} hovered={hovered} setHovered={setHovered} />
        </>
      )}
    </Box>
  );
}
