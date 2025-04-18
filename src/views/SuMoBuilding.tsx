import React, { useState, useEffect } from 'react';
import FileSelector from '../components/FileSelector';
import SuMoTypeSelector from '../components/SuMoTypeSelector';
import OutputResponseSelector from '../components/OutputResponseSelector';
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

function SuMoBuildingValidation() {
    const [fileName, setFileName] = useState([])
    const [inputVars, setInputVars] = useState([])
    const [outputVars, setOutputVars] = useState([])
    const [selectedResponse, setSelectedResponse] = useState();
    const [isLogEnabled, setIsLogEnabled] = useState(false);
    const [sumoCurves, setSumoCurves] = useState(null)

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

    // useEffect(() => {
    //     console.log("Set sumoCurves to:", sumoCurves);
    // }, [sumoCurves]);

    function runSuMo() {
        console.log("Running SuMo...");
        // const url = new URL("/flask/query_data", "http://localhost:3001")
        // url.searchParams.append("filename", "asdf")
        // url.searchParams.append("output", selectedResponse)
        const url = '/flask/sumo_along_axes' + "?filename=" + fileName + "&output=" + selectedResponse + "&inputs=" + inputVars + "&log=" + isLogEnabled
        console.log(url)
        fetch(url)
            .then(response => {
                console.log(response)
                return response.json()
            })
            .then(data => {
                setSumoCurves(data.imagePath);
            })
            .catch(error => console.debug('Error:', error));
    }

    return (
        < MetaModelingUX tabTitle="SuMo Building & Validation" headerType="sumo-header">

            {/* <FileSelector fileName={fileName} setFileName={setFileName} /> */}
            <input type="file" onChange={fetchColumnNames} /> {/* This includes fetching variable names */}

            <SuMoTypeSelector /> {/* TODO get which type of SuMo from here*/}
            <OutputResponseSelector
                responses={outputVars}
                selectedResponse={selectedResponse}
                setSelectedResponse={setSelectedResponse}
                isLogEnabled={isLogEnabled}
                setIsLogEnabled={setIsLogEnabled}
            />

            <Button onClick={runSuMo} sx={{ backgroundColor: 'purple', color: 'white' }}>
                <h5> Run</h5>
            </Button>

            <PlotImageIfExists image={sumoCurves} height={200} width={1500} />

            {/* 
            /* TODO this is also including SuMo building: choose jobs, dump into a csv file for Dakota, then call python and generate SuMo, then save and register it
            This all should also eventually be done with Functions API
            However, for now, for simplicity, simply choose the file and build the SuMo on the fly (I already have those scripts)
            The rest of the pipeline (getting outputs of Dakota, and plotting & showing) should stay the same */}

        </MetaModelingUX >
    );
}

export default SuMoBuildingValidation;
