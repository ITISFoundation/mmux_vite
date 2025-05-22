import Box from "@mui/material/Box";

// TODO this type is not working
type CvMetricsData = {
    "cv_metrics": {
        [key: string]: number;
    };
    "statistics": {
        [key: string]: number;
    };
};
type ShowCvMetrics = {
    data: CvMetricsData,
    inputVars: string[],
    qoi: string,
};

const ShowCvMetrics = (props: ShowCvMetrics) => {
    console.log("ShowCvMetrics Props", props)
    const { data, inputVars, qoi } = props;
    console.log("ShowCvMetrics data", data)
    console.log("ShowCvMetrics inputVars", inputVars)
    console.log("PlotDataShowCvMetricsTogether qoi", qoi)

    if (data === undefined || inputVars === undefined) {
        return <span>Loading...</span>;
    } else {

        return (
            <Box >

                < Box display="flex" justifyContent="space-between" alignItems="center" >
                    {
                        Object.entries(data["statistics"]).map(([metric, value]) => (
                            <Box key={metric} padding="8px" textAlign="center">
                                <strong>{metric}:</strong> {value}
                            </Box>
                        ))
                    }
                </Box >

                < Box display="flex" justifyContent="space-between" alignItems="center" >
                    {
                        Object.entries(data["cv_metrics"]).map(([metric, value]) => (
                            <Box key={metric} padding="8px" textAlign="center">
                                <strong>{metric}:</strong> {value}
                            </Box>
                        ))
                    }
                </Box >
                {/* TODO beautify. Make four columns? Or rather do with a column-plot? */}
            </Box>
        )
    }
};

export default ShowCvMetrics;