import { useState, useEffect } from 'react';
import { useMMUXContext } from '../context/MMUXContext';
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import Plot from 'react-plotly.js';


const SuMoValidation = () => {
  // This component will be perform the following tasks:
  // 1. Perform a call to the backend where all samples are evaluated through crossvalidation. 
  //    Each sample (job) will have associated y, y_hat, and error (and ofc all inputs)
  // 2. A histogram of y and a histogram of y-y_hat centered around mean(y) will be plotted
  // 3. On the right, certain statistics will be shown, such as:
  //    - Mean of y
  //    - Std of y
  //    - Mean of y-y_hat
  //    - Std of y-y_hat
  const { selectedFunction, inputVars, selectedQoI, filterSelectedJobList } = useMMUXContext();
  const [cvMetrics, setCvMetrics] = useState<any>(undefined);
  const [plotData, setPlotData] = useState<any>(undefined);

  console.log("Performing SuMo Validation for function: ", selectedFunction, " and QoI: ", selectedQoI);

  const RunSuMoValidation = async (jobs: any[]) => {
    console.info("Evaluating SuMo Validation for jobs: ", jobs);
    fetch(
      PYTHON_DAKOTA_BACKEND + '/flask/sumo_cross_validation',
      {
        method: "POST",
        body: JSON.stringify(
          {
            inputVars: inputVars,
            output: selectedQoI,
            FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
            log: false,
          }
        ),
      }).then(function (response) {
        return response.json()
      }).then(function (data) {
        console.log("SuMo Validation retrieved data: ", data);
        createDataAndMetrics(data);
      }).catch(error => console.debug('Error:', error));
  }

  const createDataAndMetrics = (data: any) => {
    if (data && selectedQoI) {
      const y = data[selectedQoI];
      const mean_y = y.reduce((a: number, b: number) => a + b, 0) / y.length;
      const std_y = Math.sqrt(y.reduce((sum: number, value: number) => sum + Math.pow(value - mean_y, 2), 0) / (y.length - 1));
      const y_hat = data[selectedQoI + "_hat"];
      const diff = y.map((value: number, index: number) => value - y_hat[index])
      const diff_shifted = diff.map((d: number) => d + mean_y);
      const std_hat = data[selectedQoI + "_std_hat"];

      // Compute global min/max for binning
      const allValues = [...y, ...y_hat];
      const minVal = Math.min(...allValues);
      const maxVal = Math.max(...allValues);
      const binCount = 5; // You can adjust the number of bins as needed
      const binSize = (maxVal - minVal) / binCount;
      const binSettings = {
        start: minVal,
        end: maxVal,
        size: binSize > 0 ? binSize : 1,
      };

      const newPlotData = [
        {
          y: y,
          type: 'histogram',
          histnorm: 'probability',
          marker: { color: '#7fc7ff' },
          name: 'Observations',
          xbins: binSettings,
        },
        {
          y: diff_shifted,
          type: 'histogram',
          histnorm: 'probability',
          marker: { color: '#2ca02c' },
          name: 'Prediction Deviations',
          xbins: binSettings,
        }
      ]
      setPlotData(newPlotData);
      console.log("Registered plotData: ", newPlotData);

      // compute statistics
      const mean_error = y.reduce((sum: number, value: number, index: number) => sum + (value - y_hat[index]), 0) / y.length;
      const std_error = Math.sqrt(y.reduce((sum: number, value: number, index: number) => sum + Math.pow(value - y_hat[index] - mean_error, 2), 0) / (y.length - 1));
      const mae = y.reduce((sum: number, value: number, index: number) => sum + Math.abs(value - y_hat[index]), 0) / y.length;
      const rmse = Math.sqrt(y.reduce((sum: number, value: number, index: number) => sum + Math.pow(value - y_hat[index], 2), 0) / y.length);
      const cvMetricsData = {
        "mean_y": mean_y,
        "std_y": std_y,
        "mean_error": mean_error,
        "std_error": std_error,
        "mae": mae,
        "rmse": rmse,
        "std_hat": std_hat,
      };
      setCvMetrics(cvMetricsData);
      console.log("Registered cvMetrics: ", cvMetricsData);
    } else {
      console.warn("No data available for SuMo validation.");
      setPlotData(undefined);
      setCvMetrics(undefined);
    }
  }

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      return await RunSuMoValidation(jobs)
    };
    run();
  }, []);

  const layout = {
    title: { text: selectedFunction?.title + " " + selectedQoI + " SuMo Validation", },
    scene: {
      xaxis: { title: { text: selectedQoI ? selectedQoI : "Quantity of Interest" } },
      yaxis: { title: { text: "Count" } },
    },
    barmode: "overlay",
  }

  return <>
    {plotData && selectedQoI && (
      <div style={{ width: '100%', maxWidth: 600 }}>
        <Plot
          data={plotData}
          layout={layout}
          style={{ width: '100%', height: 400 }}
          config={{ responsive: true }}
        />
      </div>
    )} 

  </>
}

export default SuMoValidation;