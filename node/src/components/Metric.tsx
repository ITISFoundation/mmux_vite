import { Typography, TypographyProps } from "@mui/material";

type MetricPropsType = {
    metricName: string;
    metricValue: number;
    color?: TypographyProps['color']
    percent_error?: number;
}
const Metric = (props: MetricPropsType) => {
    const { metricName, metricValue, color, percent_error } = props;
    return (
        <Typography
            variant="body1"
            fontFamily={"inherit"}
            fontWeight={100}
            color={color}
        >
            {metricName}: {percent_error
                ? <><strong>{metricValue.toPrecision(3)}</strong> ({percent_error.toPrecision(2)}% std)</>
                : <strong>{metricValue.toPrecision(3)}</strong>}
        </Typography>)
}

export default Metric;