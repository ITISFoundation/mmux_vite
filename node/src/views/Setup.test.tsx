import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Setup from "./Setup";

const mocks = vi.hoisted(() => ({ serviceMode: "" }));

vi.mock("../components/navigation/MetaModelingUX", () => ({
  default: (props: { tabTitle?: string; children?: React.ReactNode }) => (
    <div>
      <h1>{props.tabTitle}</h1>
      {props.children}
    </div>
  ),
}));
vi.mock("../components/documents/SelectFunctionDocument", () => ({ default: () => null }));
vi.mock("../components/setup/FunctionList", () => ({ ["FunctionList"]: () => <div data-testid="function-list" /> }));
vi.mock("../components/setup/InputVariableDist", () => ({
  ["InputVariableDist"]: () => <div data-testid="input-dist" />,
}));
vi.mock("../components/setup/OutputVariableDist", () => ({
  ["OutputVariableDist"]: (props: { serviceMode: string }) => {
    mocks.serviceMode = props.serviceMode;
    return <div data-testid="output-dist" />;
  },
}));

describe("Setup view", () => {
  it("mounts the full setup surface under the Select Function header", () => {
    render(<Setup serviceMode="UQ" />);
    expect(screen.getByRole("heading", { name: "Select Function" })).toBeDefined();
    expect(screen.getByTestId("function-list")).toBeDefined();
    expect(screen.getByTestId("input-dist")).toBeDefined();
    expect(screen.getByTestId("output-dist")).toBeDefined();
  });

  it("forwards serviceMode to the output scale/target surface (V12 QoI cards)", () => {
    render(<Setup serviceMode="MOGA" />);
    expect(mocks.serviceMode).toBe("MOGA");
  });
});
