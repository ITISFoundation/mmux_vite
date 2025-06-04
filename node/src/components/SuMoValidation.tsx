import { useState, useEffect } from 'react';
import { useMMUXContext } from '../context/MMUXContext';
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';
import { PlotData } from 'plotly.js';
import { FunctionJob } from '../osparc-api-ts-client';

type cvMetricsType = {
    mean_y: number;
    std_y: number;
    mean_error: number;
    std_error: number;
    mae: number;
    rmse: number;
    std_hat: number[] | number;
  }

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
  const [cvMetrics, setCvMetrics] = useState<cvMetricsType>();
  const [plotData, setPlotData] = useState<PlotData[]>();

  console.log("Performing SuMo Validation for function: ", selectedFunction, " and QoI: ", selectedQoI);

  const RunSuMoValidation = async (jobs: FunctionJob[]) => {
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

  const createDataAndMetrics = (data: {[key: string]: number[]}) => {
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
  }

  return <>
    {plotData && selectedQoI && (
      <Box display="flex" flexDirection="column" gap={1}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
          <Plot
            data={plotData}
            layout={{...layout, barmode: 'overlay'}}
            style={{ width: '100%', height: 400 }}
            config={{ responsive: true }}
          />
        </div>
          <div style={{ width: 250 }}>
          <Plot
            data={[
              {
                y: plotData[0]?.y,
                type: 'box',
                name: 'Observations',
                marker: { color: '#7fc7ff' },
                boxpoints: 'all',
              },
              {
                y: plotData[1]?.y,
                type: 'box',
                name: 'Prediction Deviations',
                marker: { color: '#2ca02c' },
                boxpoints: 'all',
              }
            ]}
            layout={{
              title: { text: 'Whisker Plot' },
              yaxis: { title: { text: selectedQoI ? selectedQoI : "Quantity of Interest" } },
              boxmode: 'group',
              margin: { t: 40, l: 40, r: 10, b: 40 },
              height: 400,
            }}
            style={{ width: '100%', height: 400 }}
            config={{ responsive: true }}
          />
          </div>
          <Box display="flex" flexDirection="row" gap={1}>

            <div style={{ minWidth: 250, fontSize: 15, lineHeight: 1.7 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">Data Statistics</Typography>
              <hr style={{ border: 0, borderTop: '2px solid #eee', margin: '8px 0 16px 0' }} />
              {cvMetrics ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li><strong>Mean (y):</strong> {cvMetrics.mean_y?.toFixed(4)}</li>
                  <li><strong>Std (y):</strong> {cvMetrics.std_y?.toFixed(4)}</li>
                  <li><strong>Skewness (y):</strong> {(() => {
                    const n = cvMetrics.std_y && cvMetrics.std_y !== 0 ? cvMetrics.std_y : 1;
                    const y = plotData[0]?.y || [];
                    const mean = cvMetrics.mean_y || 0;
                    const skew = y.length > 2
                      ? y.reduce((acc: number, val: number) => acc + Math.pow((val - mean) / n, 3), 0) * (y.length / ((y.length - 1) * (y.length - 2)))
                      : 0;
                    return skew.toFixed(4);
                  })()}</li>
                  <li><strong>Kurtosis (y):</strong> {(() => {
                    const n = cvMetrics.std_y && cvMetrics.std_y !== 0 ? cvMetrics.std_y : 1;
                    const y = plotData[0]?.y || [];
                    const mean = cvMetrics.mean_y || 0;
                    const kurt = y.length > 3
                      ? y.reduce((acc: number, val: number) => acc + Math.pow((val - mean) / n, 4), 0) * (y.length * (y.length + 1)) / ((y.length - 1) * (y.length - 2) * (y.length - 3))
                      - (3 * Math.pow(y.length - 1, 2)) / ((y.length - 2) * (y.length - 3))
                      : 0;
                    return kurt.toFixed(4);
                  })()}</li>
                </ul>
              ) : (
                <div>No data statistics available.</div>
              )}

              <Typography variant="h6" gutterBottom fontWeight="bold">Cross-Validation Metrics</Typography>
              <hr style={{ border: 0, borderTop: '2px solid #eee', margin: '8px 0 16px 0' }} />
              {cvMetrics ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li><strong>Mean Error (y - ŷ):</strong> {cvMetrics.mean_error?.toFixed(4)}</li>
                  <li><strong>Std Error (y - ŷ):</strong> {cvMetrics.std_error?.toFixed(4)}</li>
                  <li><strong>MAE:</strong> {cvMetrics.mae?.toFixed(4)}</li>
                  <li><strong>RMSE:</strong> {cvMetrics.rmse?.toFixed(4)}</li>
                  {cvMetrics.std_hat && (
                    <li><strong>Mean Pred. Std (ŷ):</strong> {Array.isArray(cvMetrics.std_hat)
                      ? (cvMetrics.std_hat.reduce((a: number, b: number) => a + b, 0) / cvMetrics.std_hat.length).toFixed(4)
                      : cvMetrics.std_hat?.toFixed(4)}</li>
                  )}
                </ul>
              ) : (
                <div>No metrics available.</div>
              )}
            </div>
          </Box>
      </div>
      </Box >
    )} 

  </>
}

export default SuMoValidation;