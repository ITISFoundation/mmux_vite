import { fireEvent, render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SuMoValidation from "./SuMoValidation";

vi.mock("react-plotly.js", () => ({
  default: ({ layout }: { layout?: Record<string, unknown> }) => (
    <div data-testid="plot-stub" data-layout={JSON.stringify(layout ?? {})} />
  ),
}));

const selectedFunction = { uid: "fn-1" };
const inputVars = ["x1"];
const distribution = {};

vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction,
    inputVars,
    distribution,
    // #663 replay: context contract grows the log-scale maps + setter consumed
    // by the auto-detect hook (stub jobs carry no outputs, so it stays inert).
    outputLogScales: {},
    outputLogScaleUserSet: {},
    setOutputLogScales: () => undefined,
    qoiScaleEvidence: {},
    setQoiScaleEvidence: () => undefined,
  }),
}));

const filteredJobList = Array.from({ length: 5 }, (_, i) => ({ uid: `job-${i}` }));

vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    fetchedJobCollections: [],
    filteredJobList,
  }),
}));

const mocks = vi.hoisted(() => ({ validationQoI: "y" }));

vi.mock("../../context/MMUXContext", () => ({
  useMMUXContext: () => ({ validationQoI: mocks.validationQoI }),
}));

describe("SuMoValidation", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("V30ab renders CV metrics from the fixed {observed,predicted} response contract", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ observed: [1, 2, 3], predicted: [1.1, 1.9, 3.2] }),
      }),
    );

    render(<SuMoValidation />);

    // observed=[1,2,3], predicted=[1.1,1.9,3.2] -> MAE = mean(|diffs|) = 0.1333
    await waitFor(() => expect(screen.getByText("0.1333")).toBeDefined());
    expect(screen.getByTestId("plot-stub")).toBeDefined();
  });

  it("V45gd ignores a stale CV response that resolves after a newer QoI request", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    let resolveStale: (r: unknown) => void = () => undefined;
    const stale = new Promise<unknown>(resolve => (resolveStale = resolve));
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementationOnce(() => stale)
        .mockImplementationOnce(() =>
          Promise.resolve({ ok: true, json: async () => ({ observed: [1, 2, 3], predicted: [1, 2.5, 5] }) }),
        ),
    );

    const { rerender } = render(<SuMoValidation />);
    mocks.validationQoI = "z";
    rerender(<SuMoValidation />);

    // newest request (diffs [0, 0.5, 2]) commits first: MAE = 0.8333 (toPrecision(4))
    await waitFor(() => expect(screen.getByText("0.8333")).toBeDefined());

    resolveStale({ ok: true, json: async () => ({ observed: [1, 2, 3], predicted: [1.1, 1.9, 3.2] }) });
    await new Promise(resolve => setTimeout(resolve, 0));

    // the stale generation's MAE (0.1333) must never overwrite the newest result
    expect(screen.queryByText("0.1333")).toBeNull();
    expect(screen.getByText("0.8333")).toBeDefined();
  });

  it("C5: display-scale toggle drives the x-axis type (view-only) and defaults linear", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ observed: [1, 2, 3], predicted: [1.1, 1.9, 3.2] }) }),
    );

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plot-stub")).toBeDefined());

    const readAxis = () =>
      (JSON.parse(screen.getByTestId("plot-stub").getAttribute("data-layout") as string) as { xaxis?: { type?: string } }).xaxis
        ?.type;
    expect(readAxis()).toBe("linear");

    const toggle = within(document.querySelector('[mmux-testid="sumo-validation-display-scale"]') as HTMLElement);
    fireEvent.click(toggle.getByRole("button", { name: "log" }));
    await waitFor(() => expect(readAxis()).toBe("log"));

    // positive-only samples: the toggle is enabled (contrast the UQ non-positive case)
    expect((toggle.getByRole("button", { name: "log" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
