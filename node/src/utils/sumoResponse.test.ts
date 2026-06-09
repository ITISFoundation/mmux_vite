import { describe, expect, it } from "vitest";
import {
  getAlongAxesPredictions,
  getGridData,
  getGridOutputValues,
  getUQHistogramData,
  getValidationSeries,
} from "./sumoResponse";

describe("sumoResponse", () => {
  it("accepts camelCase cross-validation payloads", () => {
    expect(getValidationSeries({ torque: [1, 2], torqueHat: [1.1, 1.9] }, "torque")).toEqual({
      y: [1, 2],
      yHat: [1.1, 1.9],
    });
  });

  it("accepts legacy snake_case prediction suffixes", () => {
    expect(getValidationSeries({ torque: [1, 2], torque_hat: [1.1, 1.9] }, "torque")).toEqual({
      y: [1, 2],
      yHat: [1.1, 1.9],
    });
  });

  it("accepts preserved snake_case variable names with Hat suffixes", () => {
    expect(
      getValidationSeries(
        {
          collateral_50target: [1, 2],
          collateral_50targetHat: [1.1, 1.9],
        },
        "collateral_50target",
      ),
    ).toEqual({
      y: [1, 2],
      yHat: [1.1, 1.9],
    });
  });

  it("accepts camelized response keys for snake_case QoIs", () => {
    expect(
      getValidationSeries(
        {
          collateral50target: [1, 2],
          collateral50targetHat: [1.1, 1.9],
        },
        "collateral_50target",
      ),
    ).toEqual({
      y: [1, 2],
      yHat: [1.1, 1.9],
    });
  });

  it("accepts browser-observed lowercase hat suffixes", () => {
    expect(
      getValidationSeries(
        {
          collateral50Target: [1, 2],
          collateral50Targethat: [1.1, 1.9],
        },
        "collateral_50target",
      ),
    ).toEqual({
      y: [1, 2],
      yHat: [1.1, 1.9],
    });
  });

  it("accepts camelCase along-axes payloads", () => {
    expect(
      getAlongAxesPredictions({
        predictions: {
          angleWidth: {
            x: [0, 1],
            yHat: [2, 3],
            stdHat: [0.1, 0.1],
          },
        },
      }),
    ).toEqual({
      angleWidth: {
        x: [0, 1],
        yHat: [2, 3],
        stdHat: [0.1, 0.1],
      },
    });
  });

  it("rejects snake_case along-axes payloads", () => {
    expect(
      getAlongAxesPredictions({
        predictions: {
          angleWidth: {
            x: [0, 1],
            y_hat: [2, 3],
          },
        },
      }),
    ).toBeNull();
  });

  it("accepts camelCase grid payloads", () => {
    const gridData = getGridData({
      gridData: {
        angleWidth: [0, 1],
        yHat: [
          [2, 3],
          [4, 5],
        ],
      },
    });
    expect(gridData).toEqual({
      angleWidth: [0, 1],
      yHat: [
        [2, 3],
        [4, 5],
      ],
    });
    expect(getGridOutputValues(gridData || {}, "torque")).toEqual([
      [2, 3],
      [4, 5],
    ]);
  });

  it("rejects snake_case grid payloads", () => {
    expect(
      getGridData({
        grid_data: {
          angleWidth: [0, 1],
          y_hat: [
            [2, 3],
            [4, 5],
          ],
        },
      }),
    ).toBeNull();
  });

  it("accepts camelCase uq histogram payloads", () => {
    expect(
      getUQHistogramData({
        binsStart: 0,
        binsEnd: 1,
        binMeans: [0.2, 0.8],
        binStds: [0.01, 0.02],
        q1: 0.2,
        median: 0.5,
        q3: 0.8,
        whiskerMin: 0,
        whiskerMax: 1,
        outliers: [],
        mean: 0.5,
        std: 0.1,
        min: 0,
        max: 1,
      }),
    ).toEqual({
      binsStart: 0,
      binsEnd: 1,
      binMeans: [0.2, 0.8],
      binStds: [0.01, 0.02],
      q1: 0.2,
      median: 0.5,
      q3: 0.8,
      whiskerMin: 0,
      whiskerMax: 1,
      outliers: [],
      mean: 0.5,
      std: 0.1,
      min: 0,
      max: 1,
    });
  });

  it("rejects snake_case uq histogram payloads", () => {
    expect(
      getUQHistogramData({
        bins_start: 0,
        bins_end: 1,
        bin_means: [0.2, 0.8],
        bin_stds: [0.01, 0.02],
        q1: 0.2,
        median: 0.5,
        q3: 0.8,
        whisker_min: 0,
        whisker_max: 1,
        outliers: [],
        mean: 0.5,
        std: 0.1,
        min: 0,
        max: 1,
      }),
    ).toBeNull();
  });
});
