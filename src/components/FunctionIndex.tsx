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

            try {
                const previous_funs = await FUNCTION_API.searchFunctionsByName(file.name);
                if (previous_funs.length > 0) {
                    window.alert(`A file with the name "${file.name}" is already registered.`);
                    return;
                }

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
                        "type": "local.python",
                        "url": "./examples/csv_retrieval_functions.py:retrieve_csv_result",
                        "description": "",
                        "inputSchema": createSchema(data.input_vars),
                        "outputSchema": createSchema(data.output_vars),
                        "tags": ["cacheable"],
                    }
                );


                console.log("Function registered successfully");
                refreshFunctionList()
                console.log("Displaying changes")

            } catch (error) {
                console.error("Error processing file:", error);
            }
        };

        inputElement.click();
    }

    function loadCsvValues() {
        console.log("start loadCsvValues")
        const inputElement2 = document.createElement('input');
        inputElement2.type = 'file';
        inputElement2.accept = '.csv';
        inputElement2.click();

        inputElement2.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                console.error("No file selected");
                return;
            }
            const csvData = await file.text();
            const rows = csvData.split("\n").map(row => row.split(","));
            const headers = rows[0];
            const values = rows.slice(1, 2).map(row => {
                return headers.reduce((acc, header, index) => {
                    acc[header] = parseFloat(row[index]) || row[index];
                    return acc;
                }, {} as Record<string, any>);
            });

            // TODO avoid registering duplicate functions -- should be in the API. But can also control here.
            const funs = await FUNCTION_API.searchFunctionsByName(file.name)
            if (funs.length !== 1) {
                console.error(`Expected exactly 1 function, but found ${funs.length}`);
                return;
            }
            const fun = funs[0]
            console.log("funId: ", fun.id);
            console.log("fun: ", fun)

            const job = await FUNCTION_API.runFunction(
                fun.id as number,
                values.map(value => {
                    var inputValues = Object.keys(fun.inputSchema.properties).reduce((acc, key) => {
                        if (key in value) {
                            acc[key] = value[key];
                        } else {
                            console.warn(`Missing value for input key: ${key}`);
                        }
                        return acc;
                    }, {} as Record<string, any>);
                    inputValues["csv_file_path"] = file.name
                    console.log(inputValues);
                    const result = JSON.stringify(inputValues)// Convert input values to a comma-separated string with key-value pairs
                    return result
                })[0], // TODO for debugging, just registering first one
            );
            console.log(job)

        }
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
                            <TableCell align='right'>{<Button variant="contained" onClick={() => loadCsvValues()}>Load Values</Button>}</TableCell>
                            <TableCell align='right'>{<Button variant="contained" onClick={() => undefined}>Select</Button>}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

        </Card>

    );
};

export default FunctionIndex;