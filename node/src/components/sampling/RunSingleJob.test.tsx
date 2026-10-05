import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TestJob from "./RunSingleJob";
import { runSingleJob } from "../../utils/samplingUtils";

const mocks = vi.hoisted(() => ({
  setSingleJobConfig: vi.fn(),
  setLaunchingSampling: vi.fn(),
  inputVars: ["alpha", "beta"],
  selectedFunction: { uid: "function-1" },
  singleJobConfig: [],
}));

vi.mock("../../utils/samplingUtils", () => ({ runSingleJob: vi.fn() }));
vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({ selectedFunction: mocks.selectedFunction, inputVars: mocks.inputVars }),
}));
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    singleJobConfig: mocks.singleJobConfig,
    setSingleJobConfig: mocks.setSingleJobConfig,
    setLaunchingSampling: mocks.setLaunchingSampling,
  }),
}));
vi.mock("../setup/ValueConfig", () => ({
  default: ({ inputVar }: { inputVar: { variable: string; value: number } }) => <span>{inputVar.variable}</span>,
}));
vi.mock("./RunSamplingButton", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  RunSamplingButton: ({ handleRunSampling }: { handleRunSampling: () => void }) => (
    <button type="button" onClick={handleRunSampling}>
      Run sampling
    </button>
  ),
}));

describe("RunSingleJob", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("initializes one value for each function input", async () => {
    render(<TestJob />);
    vi.mocked(console.error).mockClear();

    expect(await screen.findByText("Single Test Run")).toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(mocks.setSingleJobConfig).toHaveBeenCalledWith([
      { variable: "alpha", value: 0 },
      { variable: "beta", value: 0 },
    ]);
  });

  it("delegates a test run to the sampling utility", async () => {
    vi.mocked(runSingleJob).mockResolvedValueOnce(undefined);
    render(<TestJob />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Run sampling" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Run sampling" }));

    expect(runSingleJob).toHaveBeenCalledWith(
      { uid: "function-1" },
      [
        { variable: "alpha", value: 0 },
        { variable: "beta", value: 0 },
      ],
      mocks.setLaunchingSampling,
    );
  });
});
