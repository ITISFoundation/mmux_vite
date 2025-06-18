import React from "react";

type SuMoMetricRowPropsType = {
    children: React.ReactNode;
}
const SuMoMetricRow = (props: SuMoMetricRowPropsType) => {
    const { children } = props;
    return (
        <ul style={{
            listStyle: "none", padding: 1, margin: "0px", display: "flex", flexDirection: "row", justifyContent: "space-evenly"
        }}>
            {children}
        </ul>
    )
}
export default SuMoMetricRow;