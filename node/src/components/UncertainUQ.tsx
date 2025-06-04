import { useState, useEffect } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import Plot from "react-plotly.js";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";

type dataUQHistogramType = {
    bins_start: number;
    bins_end: number;
    bin_means: number[];
    bin_stds: number[];
}
type UncertainUQPropsType = {
    numSamples: number;
}
export default function UncertainUQ(props: UncertainUQPropsType) {
    const { numSamples } = props
    const { inputVars, selectedQoI, distribution, filterSelectedJobList } = useMMUXContext();

    const [dataUQHistogram, setDataUQHistogram] = useState<dataUQHistogramType>();

    async function runUQ(jobs: FunctionJob[]) {
        console.log("Running UQ...");
        setDataUQHistogram(undefined)
        fetch(PYTHON_DAKOTA_BACKEND + "/flask/manual_uq_propagation_with_uncertainty", {
            method: "POST",
            body: JSON.stringify({
                inputVars: inputVars,
                output: selectedQoI,
                distributions: distribution,
                FunctionJobs: jobs,
                numSamples: numSamples,
                log: false,
                nHistograms: 50,
            }),
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                console.log("UQ Data:", data);
                setDataUQHistogram(data); // now this is a dict w "mean_histogram" and "std_histogram" keys
            })
            .catch((error) => console.debug("Error:", error));
    }



    useEffect(() => {
        const run = async () => {
            const jobs = filterSelectedJobList();
            return await runUQ(jobs)
        };
        run();
    }, [numSamples]);

    return (
        <>
            {dataUQHistogram ? (
                <Plot
                    data={[
                        {
                            x: Array.from(
                                { length: dataUQHistogram.bin_means.length },
                                (_, i) =>
                                    dataUQHistogram.bins_start +
                                    ((dataUQHistogram.bins_end - dataUQHistogram.bins_start) /
                                        dataUQHistogram.bin_means.length) *
                                    (i + 0.5)
                            ),
                            y: dataUQHistogram.bin_means,
                            type: "bar",
                            marker: { color: "#1976d2" },
                            name: "UQ Histogram",
                            error_y: {
                                type: "data",
                                array: dataUQHistogram.bin_stds,
                                visible: true,
                            },
                        },
                    ]}
                    layout={{
                        title: { text: "Uncertainty Quantification Histogram" },
                        xaxis: { title: { text: selectedQoI || "Output" } },
                        yaxis: { title: { text: "Frequency" } },
                        plot_bgcolor: "#222",
                        paper_bgcolor: "#222",
                        font: { color: "#eee" },
                    }}
                    style={{ width: "100%", height: "400px" }}
                    config={{ responsive: true }} />
            ) :
                <div
                    style={{
                        width: "100%",
                        height: "400px",
                        backgroundColor: "#222",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#eee",
                        borderRadius: "4px"
                    }}
                >
                    <span>Computing Uncertainty...</span>
                </div>}
        </>
    )
}

// to call it, use 
// <UncertainUQ numSamples={numSamples} />