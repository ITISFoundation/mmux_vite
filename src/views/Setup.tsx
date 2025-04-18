// import React, { useState, useEffect } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import { 
    Button, 
    // Box 
} from '@mui/material';

type SetupType = {
    setActiveStep: (value: number) => void
}

export default function Setup(props: SetupType) {
    // const [fileName, setFileName] = useState([])
    // const [inputVars, setInputVars] = useState([])
    // const [outputVars, setOutputVars] = useState([])
    // const [selectedResponse, setSelectedResponse] = useState();
    // const [isLogEnabled, setIsLogEnabled] = useState(false);
    // const [sumoCurves, setSumoCurves] = useState(null)

    // function fetchColumnNames(event) {
    //     const filename = event.target.files[0].name
    //     if (!filename) {
    //         console.error("No file name provided");
    //         return;
    //     }
    //     setFileName(filename); // save in state
    //     // const url = new URL("/flask/query_data", "http://localhost:3001")
    //     // url.searchParams.append("filename", fileName)
    //     const url = "/flask/get_nih_inputs_outputs" + "?filename=" + filename
    //     console.log(url)
    //     return fetch(url)
    //         .then(response => {
    //             if (!response.ok) {
    //                 throw new Error('Network response was not ok');
    //             }
    //             return response.json();
    //         })
    //         // .then(console.log) // just logging
    //         .then(data => {
    //             setInputVars(data.input_vars);
    //             setOutputVars(data.output_vars);
    //         })
    //         .catch(error => console.error('Error:', error));
    // }

    // // useEffect(() => {
    // //     console.log("Set sumoCurves to:", sumoCurves);
    // // }, [sumoCurves]);

    // TODO would like to have some global state to pass "setActiveStep"
    // and also know what the previous active step was. Then, once we select the function,
    // we can go back to the previous step and go on.
    // also in that global state, we can have the selected function (although that could be a return of the FunctionIndex page)
    return (
        < MetaModelingUX tabTitle="Setup" headerType="setup-header">
            <Button onClick={() => props.setActiveStep(98)}>
                <h5> Select Function</h5>
            </Button>
        </MetaModelingUX >
    );
}

