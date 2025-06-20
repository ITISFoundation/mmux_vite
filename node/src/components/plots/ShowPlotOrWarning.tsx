import { Box } from "@mui/material"
import Plot from "react-plotly.js"
import CalculatingWarning from "../CalculatingWarning"
import InsufficientDataWarning from "../InsufficientDataWarning"
import { useMMUXContext } from "../../context/MMUXContext"

type ShowPlotOrWarningPropsType = {
    plotStyle: any;
    layout: any;
    calculating: boolean;
    plotData: Plotly.Data[];
}

const ShowPlotOrWarning = (props: ShowPlotOrWarningPropsType) => {
    const {
        plotStyle,
        layout,
        calculating,
        plotData,
    } = props;
    const { fetchedJobCollections, filterSelectedJobList } = useMMUXContext();
    console.log("Calculating: ", calculating)
    return (
        <Box
            sx={{
                width: "100%",
                height: plotStyle.height,
                overflow: plotStyle.overflow,
                borderRadius: plotStyle.borderRadius,
            }}
        >
            {(calculating) &&
                <CalculatingWarning height={plotStyle.height} dontShowText={plotData.length !== 0} />
            }
            {(!calculating && plotData.length === 0) &&
                <InsufficientDataWarning
                    fetchedJobCollections={fetchedJobCollections}
                    filterSelectedJobList={filterSelectedJobList}
                    height={plotStyle.height}
                />
            }
            {(!calculating && plotData.length !== 0) &&
                <Plot data={plotData} layout={layout} style={plotStyle} />
            }
        </Box>
    )
}

export default ShowPlotOrWarning;