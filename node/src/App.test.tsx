import { act, render, screen } from "@testing-library/react";
import { toast } from "react-toastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { getHealth } from "./utils/functionUtils";

const mocks = vi.hoisted(() => ({ loading: true, setHealthOK: vi.fn() }));
const { passthrough } = vi.hoisted(() => ({
  passthrough: ({ children }: { children: React.ReactNode }) => children,
}));

// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock("react-toastify", () => ({ toast: { error: vi.fn() }, ToastContainer: () => null }));
vi.mock("./utils/functionUtils", () => ({ getHealth: vi.fn() }));
vi.mock("./context/NavigationContext", () => {
  const value = { currentView: 0, steps: [] };
  return { useNavigationContext: () => value };
});
vi.mock("./context/PersistenceContext", () => ({
  usePersistenceContext: () => ({ loading: mocks.loading, setHealthOK: mocks.setHealthOK }),
}));
vi.mock("./context/ServiceContext", () => ({ ServiceContextProvider: passthrough }));
vi.mock("./context/FunctionContext", () => ({ FunctionContextProvider: passthrough }));
vi.mock("./context/SamplingContext", () => ({ SamplingContextProvider: passthrough }));
vi.mock("./context/MOGASettingsContext", () => ({ MOGASettingsContextProvider: passthrough }));
vi.mock("./context/MOGATableContext", () => ({ MOGATableContextProvider: passthrough }));
vi.mock("./context/JobContext", () => ({ JobContextProvider: passthrough }));
vi.mock("./context/MMUXContext", () => ({ MMUXContextProvider: passthrough }));
vi.mock("./views/SplashScreen", () => ({ default: () => <div>Splash</div> }));
// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock("./views/ReturnCurrentView", () => ({ ReturnCurrentView: () => <div>Workflow</div> }));
vi.mock("./components/navigation/Navigation", () => ({ default: () => null }));
// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock("./components/navigation/Footer", () => ({ Footer: () => null }));
vi.mock("./components/navigation/PreviewWarning", () => ({ default: () => null }));

async function poll(times: number) {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
  }
}

describe("App health gate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.loading = true;
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the workflow once the backend is healthy and persistence has loaded", async () => {
    vi.mocked(getHealth).mockResolvedValue(200);
    mocks.loading = false;
    await act(async () => {
      render(<App />);
    });

    expect(mocks.setHealthOK).toHaveBeenCalledWith(true);
    expect(screen.getByText("Workflow")).toBeInTheDocument();
    expect(getHealth).toHaveBeenCalledTimes(1);
  });

  it("keeps the splash screen while persistence is still loading", async () => {
    vi.mocked(getHealth).mockResolvedValue(200);
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText("Splash")).toBeInTheDocument();
  });

  it("keeps polling through unhealthy and unreachable responses until the backend recovers", async () => {
    vi.mocked(getHealth)
      .mockResolvedValueOnce(503)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(200);
    mocks.loading = false;
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText("Splash")).toBeInTheDocument();

    await poll(2);
    expect(screen.getByText("Workflow")).toBeInTheDocument();
    expect(getHealth).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledWith("Backend is not healthy:", expect.any(TypeError));
    vi.mocked(console.error).mockClear();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("gives up with a visible error after the retry budget is spent", async () => {
    vi.mocked(getHealth).mockResolvedValue(503);
    await act(async () => {
      render(<App />);
    });

    await poll(300);
    expect(getHealth).toHaveBeenCalledTimes(301);
    expect(toast.error).toHaveBeenCalledWith(
      "Failed to connect to the backend after multiple attempts. Please check the server status.",
    );
    vi.mocked(console.error).mockClear();

    await poll(3);
    expect(getHealth).toHaveBeenCalledTimes(301);
    expect(screen.getByText("Splash")).toBeInTheDocument();
  });

  it("does not report a connection failure when the last attempt succeeds", async () => {
    vi.mocked(getHealth).mockResolvedValue(503);
    await act(async () => {
      render(<App />);
    });
    await poll(299);
    vi.mocked(getHealth).mockResolvedValue(200);
    await poll(1);

    expect(getHealth).toHaveBeenCalledTimes(301);
    expect(toast.error).not.toHaveBeenCalled();
    vi.mocked(console.error).mockClear();
  });
});
