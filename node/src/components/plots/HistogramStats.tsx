import { Box, useTheme } from "@mui/material";
import Metric from "./Metric";
import MetricRow from "./MetricRow";

function HistogramStats(props: DataUQHistogramType) {
  const theme = useTheme();
  const { mean, std, min, max } = props;

  return (
    <Box width="100%" display="flex" justifyContent="left">
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          marginLeft: "8px",
          textAlign: "left",
        }}
        // §V13 selector contract: the four headline stats are the read-out the e2e
        // out-of-order-response guard compares against the response payloads it captured
        // on the wire (root SPEC §T47mx) — they need a stable handle, not a text match.
        mmux-testid="uq-histogram-stats"
      >
        <MetricRow width={1080}>
          <Metric metricName="Mean" metricValue={mean} />
          <Metric metricName="Std" metricValue={std} />
          <Metric metricName="Min" metricValue={min} />
          <Metric metricName="Max" metricValue={max} />
        </MetricRow>
      </Box>
    </Box>
  );
}

export default HistogramStats;
