import React from "react";

type SuMoMetricRowPropsType = {
    children: React.ReactNode;
    width: number | string;
}
const MetricRow = (props: SuMoMetricRowPropsType) => {
    const { children, width } = props;
    return (
        <ul style={{
            listStyle: "none", padding: 1, margin: "0px", display: "flex", flex: 1, flexDirection: "row", justifyContent: "space-evenly", width: width
        }}>
            {children}
        </ul>
    )
}
export default MetricRow;