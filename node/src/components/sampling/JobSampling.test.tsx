import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobSampling } from "./JobSampling";

const mocks = vi.hoisted(() => ({ permissions: "WRITE" as string }));

vi.mock("../../context/ServiceContext", () => ({ useServiceContext: () => ({ permissions: mocks.permissions }) }));
vi.mock("../data/JobSelector", () => ({ default: () => <div>Job selector</div> }));
vi.mock("./PlusButton", () => ({ default: () => <button type="button">New campaign</button> }));
// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock("./Sampling", () => ({ Sampling: () => <div>Sampling form</div> }));
vi.mock("../utils/CustomTooltip", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("JobSampling", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.permissions = "WRITE";
  });

  const renderComponent = (overrides: { loading?: boolean; disabled?: boolean; selectedFunction?: unknown } = {}) =>
    render(
      <JobSampling
        loading={overrides.loading ?? false}
        disabled={overrides.disabled}
        setLoading={vi.fn()}
        setJobProgress={vi.fn()}
        selectedFunction={overrides.selectedFunction as never}
      />,
    );

  it("opens the sampling panel when enabled", () => {
    renderComponent({ selectedFunction: { uid: "function-1" } });

    const button = screen.getByRole("button", { name: /Adapt \/ Extend Sampling/ });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(screen.getByText("Job selector")).toBeInTheDocument();
    expect(screen.getByText("New campaign")).toBeInTheDocument();
  });

  it("disables sampling for read-only permissions and loading state", () => {
    mocks.permissions = "READ-ONLY";
    renderComponent({ loading: true });

    expect(screen.getByRole("button", { name: /Adapt \/ Extend Sampling/ })).toBeDisabled();
  });
});
