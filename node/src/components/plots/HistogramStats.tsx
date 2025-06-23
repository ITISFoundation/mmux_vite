import { Typography, Box, useTheme } from "@mui/material";
import Header from "../navigation/Header";

const HistogramStats = (props: dataUQHistogramType) => {
  const theme = useTheme();
  const { q1, median, q3, whisker_min, whisker_max } = props;

  // TODO update this with the Metric / MEtricROw component
  return (
    <Box width="100%" display="flex" justifyContent="left">
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          marginLeft: "8px",
          textAlign: "left",
        }}
      >
        <Header headerType="subTitle" infoText="" tabTitle="Summary Statistics" />
        <ul style={{ listStyleType: "initial", marginLeft: "24px" }}>
          <li>
            <Typography variant="body1" fontFamily={"inherit"} fontWeight={100}>
              <strong>Median:</strong> {median.toPrecision(4)}
            </Typography>
          </li>
          <li>
            <Typography variant="body1" fontFamily={"inherit"} fontWeight={100}>
              <strong>Q1:</strong> {q1.toPrecision(4)}
            </Typography>
          </li>
          <li>
            <Typography variant="body1" fontFamily={"inherit"} fontWeight={100}>
              <strong>Q3:</strong> {q3.toPrecision(4)}
            </Typography>
          </li>
          <li>
            <Typography variant="body1" fontFamily={"inherit"} fontWeight={100}>
              <strong>Whisker Min:</strong> {whisker_min.toPrecision(4)}
            </Typography>
          </li>
          <li>
            <Typography variant="body1" fontFamily={"inherit"} fontWeight={100}>
              <strong>Whisker Max:</strong> {whisker_max.toPrecision(4)}
            </Typography>
          </li>
        </ul>
      </Box>
    </Box>
  );
};

export default HistogramStats;
