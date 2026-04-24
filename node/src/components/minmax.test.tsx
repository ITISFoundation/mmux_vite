import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, expect, it } from "vitest";
import getMinMax from "./minmax";

// Mock MUI Box
vi.mock("@mui/material", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

type SubJob = {
  selected: boolean;
  job: {
    inputs: { [key: string]: number };
    outputs: { [key: string]: number };
  };
};

describe("getMinMax", () => {
  const makeSubJobs = (inputsArr: Array<{ [key: string]: number }>, outputsArr: Array<{ [key: string]: number }>): SubJob[] =>
    inputsArr.map((inputs, idx) => ({
      selected: true,
      job: {
        inputs,
        outputs: outputsArr[idx],
      },
    }));

  it("renders correct min and max for inputs and outputs", () => {
    const subJobs = makeSubJobs(
      [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
      [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
    );

    render(getMinMax(subJobs));

    expect(screen.getByText("Inputs:")).toBeDefined();
    expect(screen.getByText(/a: \[ 1.00 – 3.00 \]/)).toBeDefined();
    expect(screen.getByText(/b: \[ 2.00 – 4.00 \]/)).toBeDefined();

    expect(screen.getByText("Outputs:")).toBeDefined();
    expect(screen.getByText(/x: \[ 10.0 – 30.0 \]/)).toBeDefined();
    expect(screen.getByText(/y: \[ 20.0 – 40.0 \]/)).toBeDefined();
  });

  it("renders single value if min equals max", () => {
    const subJobs = makeSubJobs([{ a: 5 }], [{ x: 42 }]);

    render(getMinMax(subJobs));

    expect(screen.getByText(/a: \[ 5.00 \]/)).toBeDefined();
    expect(screen.getByText(/x: \[ 42.0 \]/)).toBeDefined();
  });

  it("handles float precision correctly", () => {
    const subJobs = makeSubJobs([{ a: 1.23456 }, { a: 2.34567 }], [{ x: 9.87654 }, { x: 8.76543 }]);

    render(getMinMax(subJobs));

    expect(screen.getByText(/a: \[ 1.23 – 2.35 \]/)).toBeDefined();
    expect(screen.getByText(/x: \[ 8.77 – 9.88 \]/)).toBeDefined();
  });
});
