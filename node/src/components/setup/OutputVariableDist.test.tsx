import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OutputVariableDist } from "./OutputVariableDist";

const { useFunctionContextMock, useJobContextMock } = vi.hoisted(() => ({
  useFunctionContextMock: vi.fn(),
  useJobContextMock: vi.fn(),
}));

vi.mock("../../context/FunctionContext", () => ({ useFunctionContext: useFunctionContextMock }));
vi.mock("../../context/JobContext", () => ({ useJobContext: useJobContextMock }));

const makeJobs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ uid: `j${i + 1}`, status: "SUCCESS", outputs: { qoi: 10 + i } }));

// The exact cache key the hook computes for this fixture (uid::qoi::sortedJobUids::
// inputScaleSignature, inputVars ["x"] all-linear → "0"). Pre-seeding a receipt under
// it makes the mounted hook skip its CV pair, keeping these tests network-free.
const currentKey = "fn1::qoi::j1,j2,j3,j4,j5::0";
const evidence = {
  fn1: { qoi: { rmseLinear: Math.sqrt(3), rmseLog: 0, jobs: 5, key: currentKey } },
};

function setup(overrides: { evidence?: typeof evidence; locked?: boolean; jobCount?: number } = {}) {
  const setOutputLogScaleUserSet = vi.fn();
  useFunctionContextMock.mockReturnValue({
    selectedFunction: { uid: "fn1" },
    inputVars: ["x"],
    distribution: {},
    outputVars: ["qoi"],
    outputTargets: { fn1: { qoi: "minimize" } },
    setOutputTargets: vi.fn(),
    outputLogScales: { fn1: { qoi: false } },
    setOutputLogScales: vi.fn(),
    outputLogScaleUserSet: overrides.locked ? { fn1: { qoi: true } } : {},
    setOutputLogScaleUserSet,
    qoiScaleEvidence: overrides.evidence ?? {},
    setQoiScaleEvidence: vi.fn(),
  });
  useJobContextMock.mockReturnValue({ filteredJobList: makeJobs(overrides.jobCount ?? 5) });
  return { setOutputLogScaleUserSet };
}

const hoverScaleRow = () => {
  const row = document.querySelector('[mmux-testid="surrogate-scale-qoi"]');
  expect(row).not.toBeNull();
  fireEvent.mouseOver(row!);
};

describe("OutputVariableDist surrogate-scale provenance (V12 receipts)", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    // Never resolving: pending-detection UI stays stable for tooltip assertions.
    fetchSpy = vi.fn(() => new Promise<Response>(() => undefined));
    vi.stubGlobal("fetch", fetchSpy);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows an 'auto' chip and a tooltip with both CV errors, winner bolded", async () => {
    setup({ evidence });
    render(<OutputVariableDist serviceMode="MOGA" />);

    expect(screen.getByText("auto")).toBeDefined();
    expect(screen.queryByText("manual")).toBeNull();

    hoverScaleRow();
    expect(await screen.findByText(/CV error · 5 jobs/)).toBeDefined();
    // log won (rmse 0 < sqrt(3)); the winner is bolded, the loser stays regular.
    expect(screen.getByText("linear 1.73")).toHaveStyle({ fontWeight: 400 });
    expect(screen.getByText("log 0")).toHaveStyle({ fontWeight: 700 });
    expect(screen.getByText("Auto-selected: lower CV error wins. Toggling locks your choice.")).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled(); // receipt for the current key short-circuits detection
  });

  it("shows a 'manual' chip and the no-override line once the user toggles", async () => {
    setup({ evidence, locked: true });
    render(<OutputVariableDist serviceMode="MOGA" />);

    expect(screen.getByText("manual")).toBeDefined();
    hoverScaleRow();
    expect(await screen.findByText("Set manually — auto-detection will not override it.")).toBeDefined();
    expect(screen.getByText(/CV error · 5 jobs/)).toBeDefined(); // the receipt stays visible
  });

  it("with no verdict and too few jobs: no chip, tooltip explains when detection starts", async () => {
    setup({ jobCount: 2 });
    render(<OutputVariableDist serviceMode="MOGA" />);

    expect(screen.queryByText("auto")).toBeNull();
    expect(screen.queryByText("manual")).toBeNull();

    hoverScaleRow();
    expect(await screen.findByText("Auto-detection starts once this output has 5+ completed jobs.")).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("toggling the scale locks the pair via outputLogScaleUserSet (V27)", async () => {
    const { setOutputLogScaleUserSet } = setup({ evidence });
    render(<OutputVariableDist serviceMode="MOGA" />);

    fireEvent.click(screen.getByRole("button", { name: "log" }));
    await waitFor(() => {
      expect(setOutputLogScaleUserSet).toHaveBeenCalled();
    });
  });

  it("a receipt computed under a STALE key is not shown as the live verdict (re-review B39xk)", async () => {
    setup({
      evidence: { fn1: { qoi: { ...evidence.fn1.qoi, key: "fn1::qoi::old-jobs::0" } } },
    });
    render(<OutputVariableDist serviceMode="MOGA" />);

    expect(screen.queryByText("auto")).toBeNull(); // stale chip ⊥ rendered
    expect(screen.queryByText("manual")).toBeNull();

    hoverScaleRow();
    // key mismatch ⇒ the hook re-fires for the current key: honest pending state
    expect(await screen.findByText("Comparing linear and log cross-validation errors…")).toBeDefined();
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("footnotes the toggle when current jobs carry non-positive outputs for the QoI", async () => {
    setup();
    useJobContextMock.mockReturnValue({
      filteredJobList: [
        { uid: "j1", status: "SUCCESS", outputs: { qoi: 10 } },
        { uid: "j2", status: "SUCCESS", outputs: { qoi: 20 } },
        { uid: "j3", status: "SUCCESS", outputs: { qoi: -5 } },
        { uid: "j4", status: "SUCCESS", outputs: { qoi: 40 } },
        { uid: "j5", status: "SUCCESS", outputs: { qoi: 50 } },
      ],
    });
    render(<OutputVariableDist serviceMode="MOGA" />);

    hoverScaleRow();
    expect(
      await screen.findByText(
        "Current jobs include outputs ≤ 0 — a log fit is invalid for them and the backend will reject log requests on this output.",
      ),
    ).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled(); // ineligible: ⊥ CV pair, invalidation branch only
  });
});

describe("OutputVariableDist outside MOGA (UQ/SUMO get the scale cards, ⊥ the target surface)", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn(() => new Promise<Response>(() => undefined));
    vi.stubGlobal("fetch", fetchSpy);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function setupNonMoga() {
    const setOutputLogScaleUserSet = vi.fn();
    useFunctionContextMock.mockReturnValue({
      selectedFunction: { uid: "fn1" },
      inputVars: ["x"],
      distribution: {},
      outputVars: ["qoi", "other"],
      // UQ/SUMO never configure optimization targets:
      outputTargets: {},
      setOutputTargets: vi.fn(),
      outputLogScales: {},
      setOutputLogScales: vi.fn(),
      setOutputLogScaleUserSet,
      outputLogScaleUserSet: {},
      qoiScaleEvidence: {},
      setQoiScaleEvidence: vi.fn(),
    });
    useJobContextMock.mockReturnValue({ filteredJobList: makeJobs(5) });
    return { setOutputLogScaleUserSet };
  }

  it("renders a scale card for EVERY output variable and no target controls", () => {
    setupNonMoga();
    render(<OutputVariableDist serviceMode="UQ" />);

    expect(screen.getByText("Predicted Outputs")).toBeDefined();
    expect(screen.queryByText("Optimization Objectives")).toBeNull();
    expect(document.querySelector('[mmux-testid="surrogate-scale-qoi"]')).not.toBeNull();
    expect(document.querySelector('[mmux-testid="surrogate-scale-other"]')).not.toBeNull();

    // the MOGA-only surface is absent
    expect(screen.queryByRole("button", { name: "minimize" })).toBeNull();
    expect(screen.queryByRole("button", { name: "maximize" })).toBeNull();
    expect(screen.queryByRole("button", { name: "remove" })).toBeNull();
    expect(document.querySelector('[mmux-testid="add-output-var-btn"]')).toBeNull();
    expect(screen.queryByText("Please select at least one output variable to optimize.")).toBeNull();
  });

  it("auto-detection scopes to the output variables (⊥ targets) and the toggle still locks", async () => {
    const { setOutputLogScaleUserSet } = setupNonMoga();
    render(<OutputVariableDist serviceMode="SUMO" />);

    // eligible qoi (5 positive jobs >= max(5, n_inputs+1)=5) fires its CV double-shot;
    // "other" has no job values so it stays pending-with-explanation and adds no requests.
    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2));

    // two cards each carry a linear/log segment: scope the click to the qoi card
    const qoiRow = document.querySelector('[mmux-testid="surrogate-scale-qoi"]') as HTMLElement;
    fireEvent.click(within(qoiRow).getByRole("button", { name: "log" }));
    await waitFor(() => expect(setOutputLogScaleUserSet).toHaveBeenCalled());
  });
});
