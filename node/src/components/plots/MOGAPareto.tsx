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
import { defaultMogaValues, useMOGASettingsContext } from "../../context/MOGASettingsContext";
import { MOGAPlotModal } from "./MOGAPlotModal";
import { plotMargins, plotMargins2D } from "./PlotTools";

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
  const [selectedOptVars, setSelectedOptVars] = useState<Array<string>>([]);
  const [tableData, setTableData] = useState<MogaDataType | undefined>(undefined);
  const [hovered, setHovered] = useState<number | null>(null);

  const calculatePerformance = useCallback(
    (row: { [x: string]: number }, OVS: OutputVarSelection, minMax: { [k: string]: { min: number; max: number } }) => {
      // Performance: P_i = w_i / sum_j(w_j) * sum_j( (x_ij - min(x_j)) / (max(x_j) - min(x_j)) )
      // If minimizing, denominator is (max(x_j) - x_ij)
      const optVars = Object.keys(OVS)
      if (optVars.length === 0 || !weights) {
        // console.log("returning 0 instantly due to missing vars")
        // console.log("OVS: ", OVS)
        // console.log("weights: ", weights)
        return 0;
      }
      let normSum = 0;
      let weightSum = 0;

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
          if (OVS[varName] === "minimize") {
            diff = MaxJVal - ValueAtRowVar;
          } else if (OVS[varName] === "maximize") {
            diff = ValueAtRowVar - MinJVal;
          }
          norm = diff / (MaxJVal - MinJVal);
        } else {
          console.warn("Normalized difference setting to zero bcs MinMax is identical")
          norm = 0; // Avoid division by zero
        }
        normSum += w * norm;
        // console.log("For loop: ", varName)
        // console.log("weitght: ", w)
        // console.log("weightSum: ", weightSum)
        // console.log("ValueAtRowVar: ", ValueAtRowVar)
        // console.log("MinJVal: ", MinJVal)
        // console.log("MaxJVal: ", MaxJVal)
        // console.log("diff: ", diff)
        // console.log("norm: ", norm)
        // console.log("normSum: ", normSum)
      }
      let performance = 0;
      if (weightSum > 0) {
        performance = normSum / weightSum;
      } else if (weightSum === 0) {
        console.warn("weightSum is equal to zero! Setting performance to NaN ")
        performance = NaN;
      } else {
        console.warn("weightedSum is smaller than zero! Setting performance to NaN")
        performance = NaN;
      }
      if (performance < 0 || performance > 1 || Number.isNaN(performance)) {
        // eslint-disable-next-line no-console
        console.warn("Performance calculation out of bounds:", performance, { row, ovs: OVS, weights, minMax });
      }
      // console.log("Performance: ", performance)
      return performance;
    },
    [weights, tableData],
  );

  const groupArrayElements = <T,>(arr: Array<T>, groupSize: number) => {
    const groupedArr: Array<Array<T>> = [];
    for (let i = 0; i < arr.length; i += groupSize) {
      groupedArr.push(arr.slice(i, i + groupSize));
    }
    return groupedArr;
  };


  // Utility to get min/max for each optVar from results or tableData
  function getMinMax(optVars: string[], results: { [key: string]: number[] }, tableData?: MogaDataType) {
    const minMax: { [k: string]: { min: number; max: number } } = {};
    if (tableData && tableData.rows && tableData.rows.length > 0) {
      // console.log("Extracting min-max from Table data")
      optVars.forEach((varName: string) => {
        const values = tableData.rows.map(r => r[varName]).filter(v => typeof v === "number") as number[];
        minMax[varName] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      });
    } else if (results) {
      // console.log("Extracting min-max from MOGA results")
      optVars.forEach((varName: string) => {
        const values = results[varName] || [];
        minMax[varName] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      });
    } else {
      // Fallback: set min/max to NaN if no data
      console.warn("Neither MOGA Table nor MOGA results are available to calculate min-max")
      optVars.forEach((varName: string) => {
        minMax[varName] = { min: NaN, max: NaN };
      });
    }
    return minMax;
  }

  const runMOGA = useCallback(
    async (jobs: FunctionJob[], OVS: OutputVarSelection) => {
      const localsettings = mogaSettings[selectedFunction?.uid as string] || defaultMogaValues;
      const localOptVars = Object.keys(OVS);
      // console.log("localOptVars: ", localOptVars)
      // console.log("weights: ", weights)
      // console.log("outputVarSelection: ", OVS)
      const bodyData = JSON.stringify({
        mogaSettings: localsettings,
        inputDistributions: distribution[selectedFunction?.uid || ""],
        outputVarSelection: OVS,
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
      const minMax = getMinMax(localOptVars, results)
      // console.info("MOGA results:", results);
      // console.log("localOptVars: ", localOptVars)
      // console.log("weights: ", weights)
      // console.log("outputVarSelection: ", OVS)
      // console.log("minMax: ", minMax)

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
            OVS, minMax,
          ),
          NDI: ndi,
        })),
      };
      setSelectedOptVars(localOptVars);
      setTableData(newTableData);
      return { newTableData, localOptVars };
    },
    [mogaSettings, selectedFunction?.uid, distribution, inputVars, calculatePerformance],
  );

  const updatePlot = useCallback(
    (jobs: FunctionJob[], localTableData: MogaDataType, extPlotType?: PlotConfig, extSelectedOptVars?: string[]) => {
      const localsettings = mogaSettings[selectedFunction?.uid as string] || defaultMogaValues;
      const localOptVars = extSelectedOptVars || selectedOptVars;
      const results = localTableData?.raw ? localTableData.raw : {};
      const outputValues = aggregateOutputValues(jobs);
      // console.log("Updating MOGA Pareto plot...", jobs, localOptVars, results, outputValues);
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
          mode: "lines+markers",
          type: localPlotType === "3D" ? "scatter3d" : "scatter",
          marker: { color: "white", size: 6 },
        },
      ];

      const newLayout: Partial<Plotly.Layout> = {
        title: { text: "Pareto Front Diagram" },
        plot_bgcolor: `${theme.palette.background.default}`,
        paper_bgcolor: `${theme.palette.background.default}`,
        font: { color: `${theme.palette.text.primary}` },
        autosize: true,
        margin: localPlotType === "2D" ? plotMargins2D : plotMargins,
      };

      switch (localPlotType) {
        case "1D": {
          const groupedY = groupArrayElements(
            outputValues[localOptVars[0]],
            Math.floor(outputValues[localOptVars[0]].length / 20),
          );
          const groupedYR = groupArrayElements(results[localOptVars[0]], Math.floor(results[localOptVars[0]].length / 20));
          // Map over the grouped Y values to create multiple box plots
          groupedY.map((y, idx) =>
            newPlotData.push({
              ...newPlotData[0],
              boxpoints: "all",
              y,
              name: `${idx}`,
            }),
          );
          // Map over the calculated pareto Y values to create multiple box plots
          groupedYR.map((y, idx) =>
            newPlotData.push({
              ...newPlotData[1],
              boxpoints: "outliers",
              y,
              name: `${idx}`,
            }),
          );
          newPlotData.shift(); // these two shifts are here to remove the initial empty plots definitions
          newPlotData.shift();
          newLayout.yaxis = { title: { text: localOptVars[0] } };
          // hide the legend if only one dimension is used
          newLayout.showlegend = false;
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
          newLayout.xaxis = { title: { text: localOptVars[0] }, type: scaleType };
          newLayout.yaxis = { title: { text: localOptVars[1] }, type: scaleType };
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
            xaxis: { title: { text: localOptVars[0] }, type: scaleType },
            yaxis: { title: { text: localOptVars[1] }, type: scaleType },
            zaxis: { title: { text: localOptVars[2] }, type: scaleType },
          };
          break;
        }
        default: {
          break;
        }
      }
      // console.log("MOGA plot data:", newPlotData);

      setPlotData(newPlotData);
      setLayout(newLayout);
      setPlotType({ dimensionType: localPlotType, scaleType });
    },
    [mogaSettings, selectedFunction, selectedOptVars, theme],
  );

  useEffect(() => {
    if (!selectedFunction) {
      console.warn("No function selected!!");
    } else {
      console.debug("Information about optimization vars fetched");
      setPlotData([]);
      setSelectedOptVars([]);
      setTableData(undefined);

      const run = async () => {
        const jobs = filteredJobList;
        if (jobs.length === 0) {
          console.warn("No jobs selected for MOGA Pareto plot.");
          return;
        }
        try {
          setPropagating(true);
          console.info("Fetching MOGA Pareto data...");
          const { newTableData, localOptVars } = await runMOGA(jobs, outputTargets[selectedFunction.uid]);
          await updatePlot(jobs, newTableData, plotType, localOptVars);
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
    if (!selectedFunction) return;
    const localOptVars = Object.keys(outputTargets[selectedFunction.uid])
    const minMax = getMinMax(localOptVars, {}, tableData)
    // Recalculate performance for each row
    const newRows = tableData.rows.map(row => ({
      ...row,
      Performance: calculatePerformance(row, outputTargets[selectedFunction.uid], minMax),
    }));
    setTableData({ ...tableData, rows: newRows });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weights]);

  useEffect(() => {
    if (tableData) {
      if (hovered !== null) {
        const hoveredRow = tableData.rows.find(r => r.NDI === hovered);
        // console.log("hovered row:", hoveredRow, plotType);
        if (hoveredRow && plotType && (plotType.dimensionType === "2D" || plotType.dimensionType === "3D")) {
          const newPlotData = [...plotData];
          const noSelected = newPlotData.filter(d => d.name !== "Selected");
          noSelected.push({
            name: "Selected",
            mode: "markers",
            type: plotType.dimensionType === "3D" ? "scatter3d" : "scatter",
            marker: { color: "red", size: 8, symbol: "circle" },
            x: [hoveredRow[selectedOptVars[0]]],
            y: [hoveredRow[selectedOptVars[1]]],
            z: plotType?.dimensionType === "3D" ? [hoveredRow[selectedOptVars[2]]] : undefined,
          });
          setPlotData(noSelected);
        }
      } else {
        const newPlotData = [...plotData];
        const noSelected = newPlotData.filter(d => d.name === "Selected");
        if (noSelected.length > 0) {
          setPlotData(newPlotData.filter(d => d.name !== "Selected"));
        }
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
      {/* Similar to the "Calculating..." warning, help me introduce a warning for "Generating Visualization..." for when data has already come back from the backend but the UI is working on generating the plot */}
      {!propagating && plotData.length === 0 && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={plotStyle.height}
        />
      )}
      {!propagating && selectedFunction && plotData.length !== 0 && (
        <>
          <Plot ref={ref} data={plotData} layout={layout} style={plotStyle} />
          <MOGAPlotModal
            plotType={plotType}
            tableData={tableData}
            updatePlot={updatePlot}
            filteredJobList={filteredJobList}
            optVars={Object.keys(outputTargets[selectedFunction.uid])}
            selectedOptVars={selectedOptVars}
            setSelectedOptVars={setSelectedOptVars}
          />
          <MogaParetoTable tableData={tableData} hovered={hovered} setHovered={setHovered} />
        </>
      )}
    </Box>
  );
}
