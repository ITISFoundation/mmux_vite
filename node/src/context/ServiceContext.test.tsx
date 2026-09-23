import React from "react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import { ServiceContextProvider, useServiceContext } from "./ServiceContext";
import { getPermissions as getPermissionsImport, getServiceMode as getServiceModeImport } from "../utils/functionUtils";

vi.mock("react-toastify", () => ({ toast: { error: vi.fn(), warning: vi.fn() } }));

// Mock the utils
vi.mock("../utils/functionUtils", () => ({
  getPermissions: vi.fn(),
  getServiceMode: vi.fn(),
}));

const getPermissions = getPermissionsImport as unknown as Mock;
const getServiceMode = getServiceModeImport as unknown as Mock;

function TestComponent() {
  const { permissions, serviceMode } = useServiceContext();
  return (
    <div>
      <span data-testid="permissions">{permissions}</span>
      <span data-testid="serviceMode">{serviceMode}</span>
    </div>
  );
}

describe("ServiceContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // 👈 removes rendered components from DOM
  });

  it("provides default values before async resolves", async () => {
    getPermissions.mockResolvedValue("WRITE");
    getServiceMode.mockResolvedValue("SUMO");
    const { getByTestId } = render(
      <ServiceContextProvider>
        <TestComponent />
      </ServiceContextProvider>,
    );
    // Initial state before effect runs
    expect(getByTestId("permissions").textContent).toBe("READ-ONLY");
    expect(getByTestId("serviceMode").textContent).toBe("");
  });

  it("updates context values after async resolves", async () => {
    getPermissions.mockResolvedValue("WRITE");
    getServiceMode.mockResolvedValue("SUMO");
    const { getByTestId } = render(
      <ServiceContextProvider>
        <TestComponent />
      </ServiceContextProvider>,
    );
    await waitFor(() => {
      expect(getByTestId("permissions").textContent).toBe("WRITE");
      expect(getByTestId("serviceMode").textContent).toBe("SUMO");
    });
  });

  it("handles backend error gracefully", async () => {
    const error = new Error("fail");
    getPermissions.mockRejectedValue(error);
    getServiceMode.mockRejectedValue(error);

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByTestId } = render(
      <ServiceContextProvider>
        <TestComponent />
      </ServiceContextProvider>,
    );
    await waitFor(() => {
      expect(getByTestId("permissions").textContent).toBe("READ-ONLY");
      expect(getByTestId("serviceMode").textContent).toBe("");
      expect(errorSpy).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Could not load the service configuration from the backend. Running read-only; please reload or contact support.",
      );
    });
    errorSpy.mockRestore();
  });

  it("keeps READ-ONLY when only the service mode request fails", async () => {
    getPermissions.mockResolvedValue("WRITE");
    getServiceMode.mockRejectedValue(new Error("503"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { getByTestId } = render(
      <ServiceContextProvider>
        <TestComponent />
      </ServiceContextProvider>,
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(getByTestId("permissions").textContent).toBe("READ-ONLY");
    errorSpy.mockRestore();
  });

  it.each(["write", "ADMIN", "", undefined])("treats an unexpected permission value %j as READ-ONLY", async value => {
    getPermissions.mockResolvedValue(value);
    getServiceMode.mockResolvedValue("UQ");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { getByTestId } = render(
      <ServiceContextProvider>
        <TestComponent />
      </ServiceContextProvider>,
    );
    await waitFor(() => expect(getByTestId("serviceMode").textContent).toBe("UQ"));
    expect(getByTestId("permissions").textContent).toBe("READ-ONLY");
    expect(warnSpy).toHaveBeenCalledWith("Unexpected permissions value, falling back to READ-ONLY:", value);
    warnSpy.mockRestore();
  });

  it("throws if useServiceContext is used outside provider", () => {
    function BrokenComponent() {
      useServiceContext();
      return null;
    }
    // Suppress error boundary logs
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BrokenComponent />)).toThrow("useServiceContext must be used within a ServiceContextProvider");
    errorSpy.mockRestore();
  });
});
