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
import { useMOGATableContext } from "../../context/MOGATableContext";
import { CustomAnimatedToggle } from "../utils/CustomAnimatedToggle";
import { defaultMogaValues, useMOGASettingsContext } from "../../context/MOGASettingsContext";

export function MOGAPareto(props: LoadingPropsType) {
  const { loading, progress, jobProgress } = props;
  const theme = useTheme();
  const ref = useRef<Plot>(null);
  const { selectedFunction, inputVars, distribution, outputTargets } = useFunctionContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const { mogaSettings } = useMOGASettingsContext();
  const { weights } = useMOGATableContext();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [layout, setLayout] = useState<Partial<Plotly.Layout>>({});
  const [plotType, setPlotType] = useState<PlotConfig>();
  const [propagating, setPropagating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [outputVarSelection, setOutputVarSelection] = useState<OutputVarSelection>({});
  const [optVars, setOptVars] = useState<Array<string>>([]);
  const [tableData, setTableData] = useState<MogaDataType | undefined>(undefined);
  const [hovered, setHovered] = useState<number | null>(null);

  const calculatePerformance = useCallback(
    (row: { [x: string]: number }) => {
      // Performance: P_i = w_i / sum_j(w_j) * sum_j( (x_ij - min(x_j)) / (max(x_j) - min(x_j)) )
      // If minimizing, denominator is (max(x_j) - x_ij)
      if (optVars.length === 0 || !weights) return 0;
      let normSum = 0;
      let weightSum = 0;

      // Find min/max for each optVar from tableData if available
      const minMax: { [k: string]: { min: number; max: number } } = {};
      if (tableData && tableData.rows && tableData.rows.length > 0) {
        optVars.forEach(varName => {
          const values = tableData.rows.map(r => r[varName]).filter(v => typeof v === "number") as number[];
          minMax[varName] = {
            min: Math.min(...values),
            max: Math.max(...values),
          };
        });
      } else {
        // Fallback: use only current row if tableData is not available
        optVars.forEach(varName => {
          minMax[varName] = { min: row[varName], max: row[varName] };
        });
      }
      for (let i = 0; i < optVars.length; i += 1) {
        const varName = optVars[i];
        const w = weights[varName] || 0;
        weightSum += w;
        const ValueAtRowVar = row[varName] as number;
        const MinJVal = minMax[varName].min;
        const MaxJVal = minMax[varName].max;
        let norm = 0;
        let diff = 0;

        if (MaxJVal !== MinJVal) {
          if (outputVarSelection[varName] === "minimize") {
            diff = MaxJVal - ValueAtRowVar;
          } else if (outputVarSelection[varName] === "maximize") {
            diff = ValueAtRowVar - MinJVal;
          }
          norm = diff / (MaxJVal - MinJVal);
        } else {
          norm = 0; // Avoid division by zero
        }

        normSum += w * norm;
      }
      const performance = weightSum > 0 ? normSum / weightSum : 0;
      if (performance < 0 || performance > 1 || Number.isNaN(performance)) {
        // eslint-disable-next-line no-console
        console.warn("Performance calculation out of bounds:", performance, { row, optVars, weights, minMax });
      }
      return performance;
    },
    [optVars, weights, tableData, outputVarSelection],
  );

  const groupArrayElements = <T,>(arr: Array<T>, groupSize: number) => {
    const groupedArr: Array<Array<T>> = [];
    for (let i = 0; i < arr.length; i += groupSize) {
      groupedArr.push(arr.slice(i, i + groupSize));
    }
    return groupedArr;
  };

  const runMOGA = useCallback(
    async (jobs: FunctionJob[], ovs: OutputVarSelection) => {
      const localsettings = mogaSettings[selectedFunction?.uid as string] || defaultMogaValues;
      let localOptVars = optVars;
      if (localOptVars.length === 0) {
        console.warn("No optimization variables selected., using output var selection", ovs);
        localOptVars = Object.keys(ovs);
      }
      const bodyData = JSON.stringify({
        mogaSettings: localsettings,
        inputDistributions: distribution[selectedFunction?.uid || ""],
        outputVarSelection: ovs,
        FunctionJobs: jobs,
      });
      const response = await fetchWithRetry(`${PYTHON_DAKOTA_BACKEND}/flask/perform_moga_optimization`, {
        method: "POST",
        body: bodyData,
      });

      
      if (!response.ok) {
        throw new Error(`Error in MOGA response: ${response.status}, ${response.statusText}`);
      }

      const results: { [key: string]: number[] } = await response.json();
      console.info("MOGA results:", localOptVars, results);

      // set table data
      const newTableData: MogaDataType = {
        inputs: inputVars,
        outputs: localOptVars,
        raw: results,
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
      return newTableData;
    },
    [mogaSettings, selectedFunction?.uid, optVars, distribution, inputVars, calculatePerformance],
  );

  const updatePlot = useCallback(
    (jobs: FunctionJob[], localTableData: MogaDataType, extPlotType?: PlotConfig) => {
      const localsettings = mogaSettings[selectedFunction?.uid as string] || defaultMogaValues;
      const localOptVars = localTableData?.outputs ? localTableData.outputs : [];
      const results = localTableData?.raw ? localTableData.raw : {};
      const outputValues = aggregateOutputValues(jobs);
      console.log("Updating MOGA Pareto plot...", jobs, localOptVars, results, outputValues);
      let scaleType: "linear" | "log" = "linear";
      let localPlotType: "1D" | "2D" | "3D" = localOptVars.length < 2 ? "1D" : "2D";
      localPlotType = localOptVars.length > 2 ? "3D" : localPlotType;
      if (extPlotType) {
        localPlotType = extPlotType.dimensionType;
        scaleType = extPlotType.scaleType;
      }

      const newPlotData: Partial<Plotly.ScatterData>[] = [
        {
          name: "Sample Points",
          mode: "markers",
          type: localPlotType === "3D" ? "scatter3d" : "box",
          marker: { color: "rgb(41, 146, 221)", size: 3, symbol: "·" },
        },
        {
          name: "MOGA Samples",
          mode: "markers",
          type: localPlotType === "3D" ? "scatter3d" : "box",
          marker: { color: "rgb(255, 127, 14)", size: 2 },
        },
        {
          name: "Pareto Front",
          mode: "lines",
          type: localPlotType === "3D" ? "scatter3d" : "scatter",
          marker: { color: "lightblue", size: 10 },
        },
      ];

      const newLayout: Partial<Plotly.Layout> = {
        title: { text: "Pareto Front Diagram" },
        plot_bgcolor: `${theme.palette.background.default}`,
        paper_bgcolor: `${theme.palette.background.default}`,
        font: { color: `${theme.palette.text.primary}` },
      };

      switch (localPlotType) {
        case "1D": {
          const groupedY = groupArrayElements(outputValues[localOptVars[0]], 20);
          const groupedYR = groupArrayElements(results[localOptVars[0]], 20);
          newPlotData[0].x = groupedY.map((_, index) => index);
          newPlotData[0].y = groupedY;
          newPlotData[0].z = undefined;
          newPlotData[1].x = groupedYR.map((_, index) => index);
          newPlotData[1].y = groupedYR;
          newPlotData[1].z = undefined;
          newPlotData[0].type = "box";
          newPlotData[1].type = "box";
          newPlotData.pop();
          groupedY.map(y =>
            newPlotData.push({
              ...newPlotData[0],
              boxpoints: "all",
              y,
            }),
          );
          groupedYR.map(y =>
            newPlotData.push({
              ...newPlotData[1],
              y,
              boxpoints: "all",
            }),
          );
          newPlotData.shift();
          newPlotData.shift();
          newLayout.yaxis = { title: { text: optVars[0] } };
          break;
        }
        case "2D": {
          newPlotData[0].x = outputValues[localOptVars[0]];
          newPlotData[0].y = outputValues[localOptVars[1]];
          newPlotData[0].z = undefined;
          newPlotData[1].x = results[localOptVars[0]].slice(localsettings.populationSize * 3, results[localOptVars[0]].length);
          newPlotData[1].y = results[localOptVars[1]].slice(localsettings.populationSize * 3, results[localOptVars[1]].length);
          newPlotData[1].z = undefined;
          newPlotData[2].x = results.non_dominated_indices.map(i => (results[localOptVars[0]] as Array<number>)[i]);
          newPlotData[2].y = results.non_dominated_indices.map(i => (results[localOptVars[1]] as Array<number>)[i]);
          newPlotData[2].z = undefined;
          newPlotData[0].type = "scatter";
          newPlotData[1].type = "scatter";
          newPlotData[2].type = "scatter";
          newLayout.xaxis = { title: { text: optVars[0] }, type: scaleType };
          newLayout.yaxis = { title: { text: optVars[1] }, type: scaleType };
          break;
        }
        case "3D": {
          newPlotData[0].x = outputValues[localOptVars[0]];
          newPlotData[0].y = outputValues[localOptVars[1]];
          newPlotData[0].z = outputValues[localOptVars[2]];
          newPlotData[1].x = results[localOptVars[0]].slice(localsettings.populationSize * 3, results[localOptVars[0]].length);
          newPlotData[1].y = results[localOptVars[1]].slice(localsettings.populationSize * 3, results[localOptVars[1]].length);
          newPlotData[1].z = results[localOptVars[2]].slice(localsettings.populationSize * 3, results[localOptVars[2]].length);
          newPlotData[2].x = results.non_dominated_indices.map(i => (results[localOptVars[0]] as Array<number>)[i]);
          newPlotData[2].y = results.non_dominated_indices.map(i => (results[localOptVars[1]] as Array<number>)[i]);
          newPlotData[2].z = results.non_dominated_indices.map(i => (results[localOptVars[2]] as Array<number>)[i]);
          newPlotData[0].type = "scatter3d";
          newPlotData[1].type = "scatter3d";
          newPlotData[2].type = "scatter3d";
          newLayout.scene = {
            xaxis: { title: { text: optVars[0] }, type: scaleType },
            yaxis: { title: { text: optVars[1] }, type: scaleType },
            zaxis: { title: { text: optVars[2] }, type: scaleType },
          };
          break;
        }
        default: {
          break;
        }
      }
      console.log("MOGA plot data:", newPlotData);

      setPlotData(newPlotData);
      setLayout(newLayout);
      setPlotType({ dimensionType: localPlotType, scaleType });
    },
    [mogaSettings, selectedFunction?.uid, theme.palette.background.default, theme.palette.text.primary, optVars],
  );

  useEffect(() => {
    if (!selectedFunction) {
      console.warn("No function selected!!");
    } else {
      console.debug("Information about optimization vars fetched");
      const newOptVars = Object.keys(outputTargets[selectedFunction?.uid as string] || {});
      setOptVars(newOptVars);
      setOutputVarSelection(outputTargets[selectedFunction.uid]);
      setPlotData([]);

      const run = async () => {
        const jobs = filteredJobList;
        if (jobs.length === 0) {
          console.warn("No jobs selected for MOGA Pareto plot.");
          return;
        }
        try {
          setPropagating(true);
          console.info("Fetching MOGA Pareto data...");
          const newTableData = await runMOGA(jobs, outputTargets[selectedFunction.uid]);
          await updatePlot(jobs, newTableData, plotType);
          setPropagating(false);
        } catch (error) {
          setPropagating(false);
          console.error("Error fetching MOGA Pareto data:", error);
        }
      };
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction, outputTargets, filteredJobList, mogaSettings]);

  // When weights change, recalculate tableData (refresh table) but do NOT rerun runMOGA
  useEffect(() => {
    if (!tableData || !tableData.rows) return;
    // Recalculate performance for each row
    const newRows = tableData.rows.map(row => ({
      ...row,
      Performance: calculatePerformance(row),
    }));
    setTableData({ ...tableData, rows: newRows });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weights]);

  useEffect(() => {
    if (hovered !== null && tableData) {
      const hoveredRow = tableData.rows.find(r => r.NDI === hovered);
      // console.log("hovered row:", hoveredRow);
      if (hoveredRow && optVars.length >= 2) {
        const newPlotData = [...plotData];
        newPlotData[3] = {
          name: "Selected",
          mode: "markers",
          type: plotType?.dimensionType === "3D" ? "scatter3d" : "scatter",
          marker: { color: "red", size: 8, symbol: "circle" },
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

  const plotStyle = {
    width: "100%",
    height: 500,
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
        <InsufficientDataWarning fetchedJobCollections={fetchedJobCollections} filteredJobList={filteredJobList} height={500} />
      )}
      {!propagating && plotData.length !== 0 && (
        <>
          <Plot ref={ref} data={plotData} layout={layout} style={plotStyle} />
          <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1 }}>
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
                data={["linear", "log"]}
                value={plotType?.scaleType === "linear" ? 0 : 1}
                onChange={i => {
                  if (plotType) {
                    const calculateLog: "linear" | "log" = i === 0 ? "linear" : "log";
                    const newPlotType = { ...plotType, scaleType: calculateLog };
                    if (tableData) {
                      updatePlot(filteredJobList, tableData, newPlotType);
                    }
                  }
                }}
                disabled={[optVars.length === 0, optVars.length === 0]}
              />
            </Box>
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
                value={plotType?.dimensionType === "1D" ? 0 : plotType?.dimensionType === "2D" ? 1 : 2}
                onChange={i => {
                  if (plotType) {
                    const calculatePT: "1D" | "2D" | "3D" = i === 0 ? "1D" : i === 1 ? "2D" : "3D";
                    const newPlotType = { ...plotType, dimensionType: calculatePT };
                    if (tableData) {
                      updatePlot(filteredJobList, tableData, newPlotType);
                    }
                  }
                }}
                disabled={[!(optVars.length >= 1), !(optVars.length >= 2), !(optVars.length >= 3)]}
              />
            </Box>
          </Box>
          <MogaParetoTable tableData={tableData} hovered={hovered} setHovered={setHovered} />
        </>
      )}
    </Box>
  );
}
