import { Box, useTheme } from "@mui/material";
import Metric from "./Metric";
import MetricRow from "./MetricRow";

const HistogramStats = (props: dataUQHistogramType) => {
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
      >
        <MetricRow width={1080}>
          <Metric
            metricName={"Mean"}
            metricValue={mean}
          />
          <Metric
            metricName={"Std"}
            metricValue={std}
          />
          <Metric
            metricName={"Min"}
            metricValue={min}
          />
          <Metric
            metricName={"Max"}
            metricValue={max}
          />
        </MetricRow>
      </Box>
    </Box>
  );
};

export default HistogramStats;
