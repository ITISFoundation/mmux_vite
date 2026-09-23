import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnCurrentView } from "./ReturnCurrentView";

const mocks = vi.hoisted(() => ({ serviceMode: "SUMO" }));

vi.mock("../context/ServiceContext", () => ({ useServiceContext: () => ({ serviceMode: mocks.serviceMode }) }));
vi.mock("./Setup", () => ({ default: ({ serviceMode }: { serviceMode: string }) => <div>Setup {serviceMode}</div> }));
vi.mock("./UQ", () => ({ default: () => <div>UQ view</div> }));
vi.mock("./SuMo", () => ({ default: () => <div>SuMo view</div> }));
vi.mock("./MOGA", () => ({ default: () => <div>MOGA view</div> }));

describe("ReturnCurrentView", () => {
  beforeEach(() => {
    mocks.serviceMode = "SUMO";
  });

  it("renders nothing while the service mode is still unknown", () => {
    mocks.serviceMode = "";
    const { container } = render(<ReturnCurrentView currentView={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders Setup on step 0 with the active mode", () => {
    render(<ReturnCurrentView currentView={0} />);
    expect(screen.getByText("Setup SUMO")).toBeInTheDocument();
  });

  it.each([
    ["UQ", "UQ view"],
    ["SUMO", "SuMo view"],
    ["MOGA", "MOGA view"],
  ])("renders the %s results view on step 1", (mode, text) => {
    mocks.serviceMode = mode;
    render(<ReturnCurrentView currentView={1} />);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText("Service mode not supported")).toBeNull();
  });

  it("shows a support message instead of a results view for an unsupported mode", () => {
    mocks.serviceMode = "BOGUS";
    render(<ReturnCurrentView currentView={1} />);
    expect(screen.getByText("Service mode not supported")).toBeInTheDocument();
    expect(screen.queryByText(/view$/)).toBeNull();
  });

  it("renders nothing for an out-of-range step", () => {
    const { container } = render(<ReturnCurrentView currentView={5} />);
    expect(container).toBeEmptyDOMElement();
  });
});
