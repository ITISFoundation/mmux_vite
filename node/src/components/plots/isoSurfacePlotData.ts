type GridData = Record<string, number[] | number[][] | number>;

export function buildIsoSurfacePlotData(
  data: GridData,
  axis1: string,
  axis2: string,
  axis3: string,
  selectedQoI: string,
): Partial<Plotly.IsosurfaceData> {
  return {
    type: "isosurface",
    x: data[axis1] as number[],
    y: data[axis2] as number[],
    z: data[axis3] as number[],
    value: data[selectedQoI] as number[],
    colorscale: "Electric",
    showscale: true,
    opacity: 0.5,
    surface: { show: true, count: 10 },
  };
}
