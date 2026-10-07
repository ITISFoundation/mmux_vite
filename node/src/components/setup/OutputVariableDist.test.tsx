import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
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
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows an 'auto' chip and a tooltip with both CV errors, winner bolded", async () => {
    setup({ evidence });
    render(<OutputVariableDist />);

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
    render(<OutputVariableDist />);

    expect(screen.getByText("manual")).toBeDefined();
    hoverScaleRow();
    expect(await screen.findByText("Set manually — auto-detection will not override it.")).toBeDefined();
    expect(screen.getByText(/CV error · 5 jobs/)).toBeDefined(); // the receipt stays visible
  });

  it("with no verdict and too few jobs: no chip, tooltip explains when detection starts", async () => {
    setup({ jobCount: 2 });
    render(<OutputVariableDist />);

    expect(screen.queryByText("auto")).toBeNull();
    expect(screen.queryByText("manual")).toBeNull();

    hoverScaleRow();
    expect(await screen.findByText("Auto-detection starts once this output has 5+ completed jobs.")).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("toggling the scale locks the pair via outputLogScaleUserSet (V27)", async () => {
    const { setOutputLogScaleUserSet } = setup({ evidence });
    render(<OutputVariableDist />);

    fireEvent.click(screen.getByRole("button", { name: "log" }));
    await waitFor(() => {
      expect(setOutputLogScaleUserSet).toHaveBeenCalled();
    });
  });
});
