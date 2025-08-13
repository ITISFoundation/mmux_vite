import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { SamplingContextProvider, useSamplingContext } from "./SamplingContext";

// Mock usePersistenceContext
vi.mock("./PersistenceContext", () => {
  return {
    usePersistenceContext: () => ({
      persistence: {
        lhsSamplingConfig: { inputs: [], points: 10, seed: 1 },
        gridSamplingConfig: [],
        singleJobConfig: [{ foo: "bar" }],
        currentView: "main",
      },
      saveState: vi.fn(),
      loading: false,
    }),
  };
});

const TestComponent = () => {
  const {
    launchingSampling,
    setLaunchingSampling,
    runningSampling,
    setRunningSampling,
    lhsSamplingConfig,
    setLhsSamplingConfig,
    gridSamplingConfig,
    setGridSamplingConfig,
    singleJobConfig,
    setSingleJobConfig,
    clearSampling,
  } = useSamplingContext();

  return (
    <div>
      <div data-testid="launching">{String(launchingSampling)}</div>
      <div data-testid="running">{String(runningSampling)}</div>
      <div data-testid="lhs">{lhsSamplingConfig.points}</div>
      <div data-testid="grid">{JSON.stringify(gridSamplingConfig)}</div>
      <div data-testid="single">{JSON.stringify(singleJobConfig)}</div>
      <button onClick={() => setLaunchingSampling(true)}>Set Launching</button>
      <button onClick={() => setRunningSampling(true)}>Set Running</button>
      <button
        onClick={() =>
          setLhsSamplingConfig({ inputs: [{ variable: "1", start: 0, end: 10 }], points: 99, seed: 2 })
        }
      >
        Set LHS
      </button>
      <button onClick={() => setGridSamplingConfig([{ variable: "1", start: 0, end: 10 }, { variable: "2", start: 0, end: 10 }, { variable: "3", start: 0, end: 10 }])}>Set Grid</button>
      <button onClick={() => setSingleJobConfig([{ variable: "1", value: 5 }])}>
        Set Single
      </button>
      <button onClick={clearSampling}>Clear</button>
    </div>
  );
};

describe("SamplingContextProvider", async () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // 👈 removes rendered components from DOM
  });
  it("provides default values", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: any;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>
      );
      getByTestId = utils.getByTestId;
    });
    expect(getByTestId("launching").textContent).toBe("false");
    expect(getByTestId("running").textContent).toBe("false");
    expect(Number(getByTestId("lhs").textContent)).toBe(10); // loaded from mock persistence
    expect(getByTestId("grid").textContent).toBe("[]");
    expect(getByTestId("single").textContent).toContain("foo");
  });

  it("updates launchingSampling and runningSampling", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: any, getByText: any;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await act(() => {
      getByText("Set Launching").click();
      getByText("Set Running").click();
    });
    expect(getByTestId("launching").textContent).toBe("true");
    expect(getByTestId("running").textContent).toBe("true");
  });

  it("updates lhsSamplingConfig", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: any, getByText: any;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await act(() => {
      getByText("Set LHS").click();
    });
    expect(Number(getByTestId("lhs").textContent)).toBe(99);
  });

  it("updates gridSamplingConfig", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: any, getByText: any;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await act(() => {
      getByText("Set Grid").click();
    });
    expect(getByTestId("grid").textContent).toBe(`[{"variable":"1","start":0,"end":10},{"variable":"2","start":0,"end":10},{"variable":"3","start":0,"end":10}]`);
  });

  it("updates singleJobConfig", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: any, getByText: any;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await act(() => {
      getByText("Set Single").click();
    });
    expect(getByTestId("single").textContent).toContain(`[{"variable":"1","value":5}]`);
  });

  it("clearSampling resets all values", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: any, getByText: any;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await act(() => {
      getByText("Set Launching").click();
      getByText("Set Running").click();
      getByText("Set LHS").click();
      getByText("Set Grid").click();
      getByText("Set Single").click();
    });
    await act(() => {
      getByText("Clear").click();
    });
    expect(getByTestId("launching").textContent).toBe("false");
    expect(getByTestId("running").textContent).toBe("false");
    expect(Number(getByTestId("lhs").textContent)).toBe(50); // default
    expect(getByTestId("grid").textContent).toBe("[]");
    expect(getByTestId("single").textContent).toBe("[]");
  });

  it("throws if useSamplingContext is used outside provider", () => {
    const Broken = () => {
      useSamplingContext();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(
      "useSamplingContext must be used within a SamplingContextProvider"
    );
  });
});
