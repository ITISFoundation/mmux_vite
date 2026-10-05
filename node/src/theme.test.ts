import { describe, expect, it } from "vitest";
import { setupTheme } from "./theme";

describe("setupTheme table surfaces", () => {
  it("V32hs keeps MUI tables on the darker default surface", () => {
    const theme = setupTheme("dark");
    const tableRoot = theme.components?.MuiTable?.styleOverrides?.root;
    const components = theme.components as Record<
      string,
      { styleOverrides?: { root?: unknown; columnHeaders?: unknown } } | undefined
    >;
    const dataGridRoot = components.MuiDataGrid?.styleOverrides?.root;
    const dataGridColumnHeaders = components.MuiDataGrid?.styleOverrides?.columnHeaders;

    expect(tableRoot).toMatchObject({ backgroundColor: theme.palette.background.default });
    // V27qn: the header surface is guarded HERE - a root-only assertion passes
    // even when headers regress to the lighter paper surface.
    expect(dataGridRoot).toMatchObject({
      backgroundColor: theme.palette.background.default,
      "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
        backgroundColor: theme.palette.background.default,
      },
    });
    expect(dataGridColumnHeaders).toMatchObject({
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
    });
  });
});
