import React, { useState, useEffect } from 'react';
// import FileSelector from '../components/FileSelector';
// import SuMoTypeSelector from '../components/SuMoTypeSelector';
// import OutputResponseSelector from '../components/OutputResponseSelector';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Box } from '@mui/material';

function PlotImageIfExists(props: any) {
    return (
        props.image ? <div>
            < Box
                component="img"
                src={"results/" + props.image}
                sx={{ height: props.height, width: props.width }}
            /></div > : null
    );
}

export default function UQ() {
    // do first like SuMo building; then figure out way to register SuMo (save to a file)
    // and then pickup that "function". 
    // Ideally also save inputs & outputs to a JSON w same name, then retrieve that.
    const [fileName, setFileName] = useState([])
    const [inputVars, setInputVars] = useState([])
    const [outputVars, setOutputVars] = useState([])
    const [selectedResponse, setSelectedResponse] = useState();
    const [isLogEnabled, setIsLogEnabled] = useState(false);
    const [UQHist, setUQHist] = useState(null)

    function fetchColumnNames(event: any) {
        const filename = event.target.files[0].name
        if (!filename) {
            console.error("No file name provided");
            return;
        }
        setFileName(filename); // save in state
        // const url = new URL("/flask/query_data", "http://localhost:3001")
        // url.searchParams.append("filename", fileName)
        const url = "/flask/get_nih_inputs_outputs" + "?filename=" + filename
        console.log(url)
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            // .then(console.log) // just logging
            .then(data => {
                setInputVars(data.input_vars);
                setOutputVars(data.output_vars);
            })
            .catch(error => console.error('Error:', error));
    }

    function runUQ() {
        console.log("Running UQ...");
        // const url = new URL("/flask/query_data", "http://localhost:3001")
        // url.searchParams.append("filename", "asdf")
        // url.searchParams.append("output", selectedResponse)
        const url = '/flask/uq_propagation' + "?filename=" + fileName + "&output=" + selectedResponse + "&inputs=" + inputVars + "&log=" + isLogEnabled
        console.log(url)
        fetch(url)
            .then(response => {
                console.log(response)
                return response.json()
            })
            .then(data => {
                setUQHist(data.imagePath);
            })
            .catch(error => console.debug('Error:', error));
    }

    return (
        // Copy the structure from SuMo building; refactor the PY script as a Flask callback. 
        // Fixed Means & Stds (inside Python), will make that customizable later on.
        <MetaModelingUX tabTitle="Uncertainty Quantification" headerType="application-header">
            {/* 
            <input type="file" onChange={fetchColumnNames} />
            <SuMoTypeSelector />
            <OutputResponseSelector
                responses={outputVars}
                selectedResponse={selectedResponse}
                setSelectedResponse={setSelectedResponse}
                isLogEnabled={isLogEnabled}
                setIsLogEnabled={setIsLogEnabled}
            /> 
            */}
            <div> 
            Do w FunctionsAPI - fetch the SuMo already registered
            </div> 
            {/* TODO input distributions (see how I do it to generate Dakota file)
            either give option to user or also populate with defaults */}
            <Button 
                disabled
                onClick={runUQ}
                style={{ backgroundColor: 'purple', color: 'grey', height:"40px"}}
            >
                <h5> Run</h5>
            </Button>
            <PlotImageIfExists image={UQHist} height={300} width={400} />
        </MetaModelingUX >
    );
}