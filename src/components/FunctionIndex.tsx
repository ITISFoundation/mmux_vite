import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, TableRow, TableCell, TableBody, TableHead, Paper, Button } from "@mui/material";
// import ApiClient from '../../functions-api-react-client'; // Importing the folder outside of "components"
// Assuming your folder structure is: project-root/components/your-file.js
// If it's not directly under components/, you can adjust this path accordingly.
// import { ApiClient } from "../functions-api-react-client"; // the "index" in this module is not found -- do I need to npm install it?

// import ApiClient from "../functions-api-js-client/src/ApiClient";
// import FunctionApi from "../functions-api-js-client/src/api/FunctionApi";
import { FunctionApi, ServerConfiguration, createConfiguration, Function } from '../functions-api-ts-client';
// import FunctionJobApi from "../functions-api-react-client/src/api/FunctionJobApi.js";
// Attempted import error: './ValidationErrorLocInner' does not contain a default export (imported as 'ValidationErrorLocInner').
// ERROR in ./src/functions-api-react-client/src/model/ValidationError.js 58:59-82
// export 'default' (imported as 'ValidationErrorLocInner') was not found in './ValidationErrorLocInner' (module has no exports)


// import { FunctionApi, createConfiguration } from '../functions-api-ts-client';
const server = new ServerConfiguration('http://127.0.0.1:8087', {})
const config = createConfiguration({ baseServer: server });

// Create an instance of the Function class
const newFunction = new Function();

// Assign values to its properties
newFunction.name = "Example Function";
newFunction.type = "Custom";
newFunction.url = "http://localhost:8000/example";
newFunction.description = "This is an example function.";
newFunction.tags = ["example", "test"];

console.log("Created Function instance:", newFunction);


function FunctionIndex() {
    const [functions, setFunctions] = useState([]);


    function refreshFunctionList() {
        const t = new FunctionApi(config)
        t.listFunctions()
            .then(response => {
                console.debug("response: ", response);
                setFunctions(response);
            })
            .catch(error => {
                console.error("Error fetching functions: ", error);
            });
    }

    function showList(list: string[]) {
        // return [list.map(input => `'${input}'`).join(', ')]
        if (list === null) {
            console.log("No input/output schema")
            return [""]
        }

        return [list.join(', ')]
    }

    return (
        <Card variant="outlined" sx={{ marginBottom: "10px" }}>
            <Typography variant="h4" textAlign={"center"} >
                Function Index
            </Typography>
            <Button onClick={() => refreshFunctionList()}>Refresh Function List</Button>
            <Table component={Paper}>
                <TableHead>
                    <TableRow>
                        {/* Adjust headers based on your data sTableRowucture */}
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Inputs</TableCell>
                        <TableCell>Outputs</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {functions.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{showList(item.input_schema)}  </TableCell>
                            <TableCell>{showList(item.output_schema)}</TableCell>
                            <TableCell align='right'>{<Button variant="contained" onClick={() => undefined}>Select</Button>}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

        </Card>

    );
};

export default FunctionIndex;