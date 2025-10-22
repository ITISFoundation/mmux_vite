import { Typography, TypographyProps } from "@mui/material";

type MetricPropsType = {
  metricName: string;
  metricValue: number;
  color?: TypographyProps["color"];
};
function Metric(props: MetricPropsType) {
  const { metricName, metricValue, color } = props;
  return (
    <Typography variant="body1" fontFamily="inherit" fontWeight={100} color={color}>
      {metricName}: <strong>{metricValue.toPrecision(4)}</strong>
    </Typography>
  );
}

export default Metric;
