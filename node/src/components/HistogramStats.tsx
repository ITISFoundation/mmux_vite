import { Typography, Box, useTheme } from "@mui/material";

const HistogramStats = (props: dataUQHistogramType) => {

    const theme = useTheme();
    const { q1, median, q3, whisker_min, whisker_max } = props

    return (
        <Box mt={3} width="100%" display="flex" justifyContent="center">
            <Box
                sx={{
                    background: theme.palette.background.paper,
                    borderRadius: "8px",
                    boxShadow: 1,
                    p: 2,
                    minWidth: 320,
                    maxWidth: 480,
                    textAlign: "center"
                }}
            >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Summary Statistics
                </Typography>
                <Typography variant="body2">
                    <strong>Median:</strong> {median.toPrecision(4)}
                </Typography>
                <Typography variant="body2">
                    <strong>Q1:</strong> {q1.toPrecision(4)}
                </Typography>
                <Typography variant="body2">
                    <strong>Q3:</strong> {q3.toPrecision(4)}
                </Typography>
                <Typography variant="body2">
                    <strong>Whisker Min:</strong> {whisker_min.toPrecision(4)}
                </Typography>
                <Typography variant="body2">
                    <strong>Whisker Max:</strong> {whisker_max.toPrecision(4)}
                </Typography>
            </Box>
        </Box>
    )
}

export default HistogramStats;