import { fireEvent, render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { captureBlobDownloads } from "../../test/downloadCapture";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SuMoValidation from "./SuMoValidation";

vi.mock("react-plotly.js", () => ({
  default: ({ data, layout }: { data?: unknown[]; layout?: Record<string, unknown> }) => (
    <div data-testid="plot-stub" data-traces={JSON.stringify(data ?? [])} data-layout={JSON.stringify(layout ?? {})} />
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

  it("B54rz: violin density is restricted to the data support (spanmode hard) so log display never rasterizes x<=0 spill", async () => {
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

    // The canLog gate checks RAW sample values (all > 0 here). Under the default
    // soft spanmode, Plotly extends the KDE curve beyond the data into x<=0, and a
    // log x-axis rasterizes that spill as a NaN SVG path (e2e console-error catch).
    // spanmode hard keeps the rendered geometry inside the samples, making the
    // gate's premise true for EVERYTHING Plotly paints.
    const traces = JSON.parse(screen.getByTestId("plot-stub").getAttribute("data-traces") as string) as Array<{
      type?: string;
      spanmode?: string;
    }>;
    expect(traces).toHaveLength(2);
    for (const trace of traces) {
      expect(trace.type).toBe("violin");
      expect(trace.spanmode).toBe("hard");
    }
  });
});

describe("SuMoValidation raw-data download (T30ln(b) sweep, fork issue #79)", () => {
  const stubResizeObserver = () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  };

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.validationQoI = "y";
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exports the CV response verbatim without any refetch (violin source data)", async () => {
    stubResizeObserver();
    mocks.validationQoI = "dl-y";
    const payload = { observed: [1, 2, 3], predicted: [1.1, 1.9, 3.2] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);
    const downloads = captureBlobDownloads();

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plot-stub")).toBeDefined());

    const button = (document.querySelector('[mmux-testid="download-validation-data-btn"]') as HTMLElement).querySelector(
      "button",
    ) as HTMLElement;
    fireEvent.click(button);

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toBe("sumo-validation-dl-y.json");
    // verbatim {observed,predicted}: users can re-derive MAE/RMSE or re-plot the violins
    expect(JSON.parse(await downloads[0].text())).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1); // ⊥ refetch on click (V46sc cache-read)
  });

  it("offers no download when the response lacks the observed/predicted series", async () => {
    stubResizeObserver();
    mocks.validationQoI = "dl-missing";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ unexpected: true }) }));

    render(<SuMoValidation />);
    // getValidationSeries finds no series → createDataAndMetrics throws → the
    // ApiError-free generic warning; either way no raw response was committed
    expect(await screen.findByText(/did not include observed and predicted series/i)).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="download-validation-data-btn"]')).toBeNull();
  });

  it("offers no download after a failed fetch", async () => {
    stubResizeObserver();
    mocks.validationQoI = "dl-fail";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "cv boom" }));

    render(<SuMoValidation />);
    expect(await screen.findByText(/failed|cv boom/i)).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="download-validation-data-btn"]')).toBeNull();
  });
});
