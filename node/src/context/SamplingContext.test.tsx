import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, cleanup, Matcher, MatcherOptions, waitFor } from "@testing-library/react";
import { SamplingContextProvider, useSamplingContext } from "./SamplingContext";

// Mock usePersistenceContext
vi.mock("./PersistenceContext", () => ({
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
}));

// Mock usePersistenceContext
vi.mock("./FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction: { uid: "1", name: "Test Function" },
    outputVars: ["output1", "output2"],
  }),
}));

function TestComponent() {
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
      <div mmux-testid="launching">{String(launchingSampling)}</div>
      <div mmux-testid="running">{String(runningSampling)}</div>
      <div mmux-testid="lhs">{lhsSamplingConfig.points}</div>
      <div mmux-testid="grid">{JSON.stringify(gridSamplingConfig)}</div>
      <div mmux-testid="single">{JSON.stringify(singleJobConfig)}</div>
      <button type="button" onClick={() => setLaunchingSampling(true)}>
        Set Launching
      </button>
      <button type="button" onClick={() => setRunningSampling(true)}>
        Set Running
      </button>
      <button
        type="button"
        onClick={() => setLhsSamplingConfig({ inputs: [{ variable: "1", start: 0, end: 10 }], points: 99, seed: 2 })}
      >
        Set LHS
      </button>
      <button
        type="button"
        onClick={() =>
          setGridSamplingConfig([
            { variable: "1", start: 0, end: 10 },
            { variable: "2", start: 0, end: 10 },
            { variable: "3", start: 0, end: 10 },
          ])
        }
      >
        Set Grid
      </button>
      <button type="button" onClick={() => setSingleJobConfig([{ variable: "1", value: 5 }])}>
        Set Single
      </button>
      <button type="button" onClick={clearSampling}>
        Clear
      </button>
    </div>
  );
}

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
        </SamplingContextProvider>,
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
    let getByTestId: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    let getByText: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>,
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await act(() => {
      getByText("Set Launching").click();
      getByText("Set Running").click();
    });
    await waitFor(() => {
      expect(getByTestId("launching").textContent).toBe("true");
      expect(getByTestId("running").textContent).toBe("true");
    });
  });

  it("updates lhsSamplingConfig", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    let getByText: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>,
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await act(() => {
      getByText("Set LHS").click();
    });
    await waitFor(() => {
      expect(Number(getByTestId("lhs").textContent)).toBe(99);
    });
  });

  it("updates gridSamplingConfig", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    let getByText: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    await act(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>,
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await act(() => {
      getByText("Set Grid").click();
    });
    await waitFor(() =>
      expect(getByTestId("grid").textContent).toBe(
        `[{"variable":"1","start":0,"end":10},{"variable":"2","start":0,"end":10},{"variable":"3","start":0,"end":10}]`,
      ),
    );
  });

  it("updates singleJobConfig", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    let getByText: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    await waitFor(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>,
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await waitFor(() => {
      getByText("Set Single").click();
    });
    await waitFor(() => {
      expect(getByTestId("single").textContent).toContain(`[{"variable":"1","value":5}]`);
    });
  });

  it("clearSampling resets all values", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let getByTestId: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    let getByText: (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;
    await waitFor(() => {
      const utils = render(
        <SamplingContextProvider>
          <TestComponent />
        </SamplingContextProvider>,
      );
      getByTestId = utils.getByTestId;
      getByText = utils.getByText;
    });
    await waitFor(() => {
      getByText("Set Launching").click();
      getByText("Set Running").click();
      getByText("Set LHS").click();
      getByText("Set Grid").click();
      getByText("Set Single").click();
    });
    await waitFor(() => {
      getByText("Clear").click();
    });
    await waitFor(() => {
      expect(getByTestId("launching").textContent).toBe("false");
      expect(getByTestId("running").textContent).toBe("false");
      expect(Number(getByTestId("lhs").textContent)).toBe(50); // default
      expect(getByTestId("grid").textContent).toBe("[]");
      expect(getByTestId("single").textContent).toBe("[]");
    });
  });

  it("throws if useSamplingContext is used outside provider", () => {
    function Broken() {
      useSamplingContext();
      return null;
    }
    expect(() => render(<Broken />)).toThrow("useSamplingContext must be used within a SamplingContextProvider");
  });
});
