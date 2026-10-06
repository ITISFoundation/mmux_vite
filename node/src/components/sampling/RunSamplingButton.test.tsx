import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RunSamplingButton } from "./RunSamplingButton";

const mocks = vi.hoisted(() => ({
  permissions: "WRITE" as string,
  launchingSampling: false,
  setLaunchingSampling: vi.fn(),
  setRunningSampling: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../context/ServiceContext", () => ({
  useServiceContext: () => ({ permissions: mocks.permissions }),
}));
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    launchingSampling: mocks.launchingSampling,
    setLaunchingSampling: mocks.setLaunchingSampling,
    setRunningSampling: mocks.setRunningSampling,
  }),
}));
vi.mock("../../utils/functionUtils", () => ({ getSimplifiedHost: () => "example.test" }));
vi.mock("../utils/CustomTooltip", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("react-toastify", () => ({ toast: { error: mocks.toastError } }));

const renderButton = (handleRunSampling = vi.fn().mockResolvedValue(undefined), disabled = false) =>
  render(<RunSamplingButton handleRunSampling={handleRunSampling} disabled={disabled} testId="sampling-button" />);

describe("RunSamplingButton", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.permissions = "WRITE";
    mocks.launchingSampling = false;
  });

  it("runs successfully and marks sampling as running", async () => {
    const handleRunSampling = vi.fn().mockResolvedValue(undefined);
    renderButton(handleRunSampling);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(handleRunSampling).toHaveBeenCalledOnce());
    expect(mocks.setRunningSampling).toHaveBeenCalledWith(true);
    expect(mocks.setLaunchingSampling).not.toHaveBeenCalled();
  });

  it("reports failed runs and resets both sampling flags", async () => {
    const error = new Error("launch failed");
    const handleRunSampling = vi.fn().mockRejectedValue(error);
    renderButton(handleRunSampling);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Failed to run job(s). Please check the console for details."),
    );
    expect(mocks.setLaunchingSampling).toHaveBeenCalledWith(false);
    expect(mocks.setRunningSampling).toHaveBeenCalledWith(false);
    vi.mocked(console.error).mockClear();
  });

  it.each(["READ-ONLY", "write", ""])("disables the button and never launches for permissions %j", permissions => {
    mocks.permissions = permissions;
    const handleRunSampling = vi.fn().mockResolvedValue(undefined);
    renderButton(handleRunSampling);

    const button = screen.getByRole("button", { name: "Run" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleRunSampling).not.toHaveBeenCalled();
  });

  it("disables the button when explicitly disabled even with WRITE permissions", () => {
    renderButton(undefined, true);

    expect(screen.getByRole("button", { name: "Run" })).toBeDisabled();
  });

  it("shows the launching state and disables while a launch is active", () => {
    mocks.launchingSampling = true;
    renderButton();

    expect(screen.getByText("Launching...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Launching/ })).toBeDisabled();
  });
});
