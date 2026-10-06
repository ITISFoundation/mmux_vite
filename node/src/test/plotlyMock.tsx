// Shared `react-plotly.js` stand-in: jsdom cannot render Plotly, so expose the traces for assertions.
export default function Plot({ data, layout }: { data?: unknown[]; layout?: { title?: unknown } }) {
  return <div data-testid="plotly" data-traces={JSON.stringify(data ?? [])} data-layout={JSON.stringify(layout ?? {})} />;
}
