import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JobRow from "./JobRow";

const mocks = vi.hoisted(() => ({
  createJobStudyCopy: vi.fn(),
  openStudyUid: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("../../utils/functionUtils", () => ({
  createJobStudyCopy: mocks.createJobStudyCopy,
  openStudyUid: mocks.openStudyUid,
}));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ parseStatus: (_status: string, values: unknown) => JSON.stringify(values) }),
}));
vi.mock("../utils/CustomTooltip", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("react-toastify", () => ({ toast: { warning: mocks.toastWarning } }));

const makeJob = (status: string, selected = false) => ({
  selected,
  job: {
    uid: `job-${status.toLowerCase()}`,
    status,
    inputs: { alpha: 1.23456 },
    outputs: { result: 4.56 },
  },
});

describe("JobRow", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a placeholder row when the job is missing", () => {
    render(
      <table>
        <tbody>
          <JobRow jobUid="missing-job" jobList={[]} setSelected={vi.fn()} />
        </tbody>
      </table>,
    );

    expect(screen.getByText("missi...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeDisabled();
  });

  it("selects successful jobs and opens a successful job copy", async () => {
    const setSelected = vi.fn();
    const job = makeJob("SUCCESS");
    mocks.createJobStudyCopy.mockResolvedValueOnce("copy-1");
    render(
      <table>
        <tbody>
          <JobRow jobUid={job.job.uid} jobList={[job]} selectedFunction={{ title: "Demo" } as never} setSelected={setSelected} />
        </tbody>
      </table>,
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect(setSelected).toHaveBeenCalledWith(true, job.job.uid);

    fireEvent.click(screen.getByRole("button", { name: "View" }));
    await waitFor(() => expect(mocks.createJobStudyCopy).toHaveBeenCalledWith("Demo", job.job));
    expect(mocks.openStudyUid).toHaveBeenCalledWith("copy-1");
  });

  it("warns when a failed job copy cannot be opened", async () => {
    const job = makeJob("FAILED");
    mocks.createJobStudyCopy.mockResolvedValueOnce("");
    render(
      <table>
        <tbody>
          <JobRow jobUid={job.job.uid} jobList={[job]} selectedFunction={{ title: "Demo" } as never} setSelected={vi.fn()} />
        </tbody>
      </table>,
    );

    fireEvent.click(screen.getByRole("button", { name: "View" }));
    await waitFor(() => expect(mocks.toastWarning).toHaveBeenCalledWith("Could not open Job copy in new window!"));
  });
});
