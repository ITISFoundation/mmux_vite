import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, TableRow, TableCell, TableBody, TableHead, Paper, Button } from "@mui/material";
import { FunctionApi, ServerConfiguration, createConfiguration, Function } from '../functions-api-ts-client';

const PYTHON_DAKOTA_BACKEND = 'http://127.0.0.1:5000'
const FUNCTION_API = new FunctionApi(createConfiguration(
    { baseServer: new ServerConfiguration('http://127.0.0.1:8087', {}) }
));

function FunctionIndex() {
    const [functions, setFunctions] = useState<Function[]>([]);

    function loadCsv() {
        console.log("start")
        const inputElement = document.createElement('input');
        inputElement.type = 'file';
        inputElement.accept = '.csv';

        inputElement.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                console.error("No file selected");
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {

                const response = await fetch(
                    PYTHON_DAKOTA_BACKEND
                    + '/flask/get_nih_inputs_outputs'
                    + "?filename=" + file.name
                );

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                console.log("Response: ", response)

                const body = await response.text();
                const data: { input_vars: string[]; output_vars: string[] } = JSON.parse(body);

                function createSchema(vars: string[]) {
                    return {
                        "type": "object",
                        "properties": vars.reduce((acc, curr) => {
                            acc[curr] = { "type": "number" };
                            return acc;
                        }, {} as Record<string, any>),
                        "required": vars,
                    }
                }
                console.log("File: ", file)
                await FUNCTION_API.createFunction(
                    {
                        "name": file.name,
                        "type": "",
                        "url": PYTHON_DAKOTA_BACKEND
                            + "/flask/retrieve_csv_result"
                            + "?csv_file_path=" + file.name,
                        "description": "",
                        "inputSchema": createSchema(data.input_vars),
                        "outputSchema": createSchema(data.output_vars)
                    }
                );

                // const csvData = await file.text();
                // const rows = csvData.split("\n").map(row => row.split(","));
                // const headers = rows[0];
                // const values = rows.slice(1).map(row => {
                //     return headers.reduce((acc, header, index) => {
                //         acc[header] = parseFloat(row[index]) || row[index];
                //         return acc;
                //     }, {} as Record<string, any>);
                // });

                // // TODO avoid registering duplicate functions -- should be in the API. But can also control here.
                // const funs = await FUNCTION_API.searchFunctionsByName(file.name)
                // const funId = funs[0].id
                // // console.log("funId: ", funId)
                // await FUNCTION_API.batchRunFunction({
                //     functionId: funId,
                //     jobs: values.map(value => ({
                //         input: Object.fromEntries(data.input_vars.map(varName => [varName, value[varName]])),
                //         output: Object.fromEntries(data.output_vars.map(varName => [varName, value[varName]])),
                //     })),
                // });

                console.log("Function registered successfully");
                refreshFunctionList()
                console.log("Displaying changes")

            } catch (error) {
                console.error("Error processing file:", error);
            }
        };

        inputElement.click();
    }

    function refreshFunctionList() {
        FUNCTION_API.listFunctions()
            .then(response => {
                console.debug("response: ", response);
                setFunctions(response);
            })
            .catch(error => {
                console.error("Error fetching functions: ", error);
            });
    }

    function clearFunctionList() {
        FUNCTION_API.deleteAllFunctions()
            .then(() => {
                console.log("Function list cleared successfully");
                refreshFunctionList();
            })
            .catch(error => {
                console.error("Error clearing function list: ", error);
            });
    }

    function showInputOutputSchema(schema: { type: string; properties: Record<string, any>; required: string[] }) {
        if (!schema || schema.type !== "object" || !schema.properties) {
            console.error("Invalid schema:", schema);
            return [];
        }

        const vars = Object.keys(schema.properties);
        const display_vars = vars.map((variable, index) => (
            <React.Fragment key={index}>
                {variable}
                <br />
            </React.Fragment>
        ));
        return <div
            style={{
                maxWidth: "150px",
                maxHeight: "50px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                position: "relative"
            }}
            title={schema ? vars.join(", ") : ""}>
            {display_vars}
        </div>

    }



    useEffect(() => {
        refreshFunctionList();
        console.log(functions)
    }, []);
    return (
        <Card variant="outlined" sx={{ marginBottom: "10px", marginTop: "10px" }}>
            <Typography variant="h4" textAlign={"center"} >
                Function Index
            </Typography>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "10px" }}>
                <Button onClick={() => refreshFunctionList()}>Refresh Function List</Button>
                <Button onClick={() => clearFunctionList()}>Clear Function List</Button>
                <Button variant="contained" color="secondary" onClick={() => loadCsv()}>Load Results from CSV</Button>
            </div>
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
                            <TableCell>
                                {showInputOutputSchema(item.inputSchema)}
                                {/* <div style={{
                                    maxWidth: "150px",
                                    maxHeight: "50px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    position: "relative"
                                }}
                                    title={item.inputSchema ? Object.keys(item.inputSchema.properties).join(", ") : ""}
                                >
                                    {showInputOutputSchema(item.inputSchema)}
                                </div> */}
                            </TableCell>
                            <TableCell>{showInputOutputSchema(item.outputSchema)}</TableCell>
                            <TableCell align='right'>{<Button variant="contained" onClick={() => undefined}>Select</Button>}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

        </Card>

    );
};

export default FunctionIndex;