import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, TableRow, TableCell, TableBody, TableHead, Paper, Button } from "@mui/material";
import { Function, FunctionJob, FunctionJobCollection } from '../functions-api-ts-client';
import { FUNCTION_API, PYTHON_DAKOTA_BACKEND } from './api_objects';
import { findFunction, waitJobCompletion, createInputOutputSchema } from './function_utils';
import { pickCsv, readCsvData } from './csv_utils.ts'

export async function registerCsvAsFunction(file: File) {
    try {
        const previous_funs = await FUNCTION_API.searchFunctionsByName(file.name);
        if (previous_funs.length > 0) {
            if (previous_funs.length > 1) {
                throw new Error(`Multiple functions with the name "${file.name}" are already registered.`);
            } else {
                window.alert(`A file with the name "${file.name}" is already registered.`);
                return previous_funs[0];
            }
        }
        const response = await fetch(
            PYTHON_DAKOTA_BACKEND
            + '/flask/get_nih_inputs_outputs'
            + "?filename=" + file.name
        );
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const body = await response.text();
        const data: { input_vars: string[]; output_vars: string[] } = JSON.parse(body);

        await FUNCTION_API.createFunction(
            {
                "name": file.name,
                "type": "local.python",
                "url": "./examples/csv_retrieval_functions.py:retrieve_csv_result",
                "description": "",
                "inputSchema": createInputOutputSchema(data.input_vars),
                "outputSchema": createInputOutputSchema(data.output_vars),
                "tags": ["cacheable"],
            }
        );

        const fun = await findFunction(file.name)
        console.log("Function registered successfully with id: ", fun.id);
        return fun;
    } catch (error) {
        console.error("Error processing file:", error);
    }
};

export async function registerCsvValuesAsFunctionJobs(fun: Function, file: File, asJobCollection: boolean = false): Promise<Job[]> {
    if (!fun) {
        throw new Error("Need to provide a Function to registerCsvValuesAsFunctionJobs");
    }
    if (!file) {
        throw new Error("Need to provide a File to registerCsvValuesAsFunctionJobs");
    }
    const data = await readCsvData(file)
    const headers = data[0]
    const rows = data[1]

    if (!asJobCollection) {
        const values = rows.map(row => {
            return headers.reduce((acc, header, index) => {
                acc[header] = parseFloat(row[index]) || row[index];
                return acc;
            }, {} as Record<string, any>);
        });

        // let job = await FUNCTION_API.runFunction(
        //     fun.id as number,
        //     values.map(value => {
        //         var inputValues = Object.keys(fun.inputSchema.properties).reduce((acc, key) => {
        //             if (key in value) {
        //                 acc[key] = value[key];
        //             } else {
        //                 console.warn(`Missing value for input key: ${key}`);
        //             }
        //             return acc;
        //         }, {} as Record<string, any>);
        //         inputValues["csv_file_path"] = file.name
        //         const result = JSON.stringify(inputValues)// Convert input values to a comma-separated string with key-value pairs
        //         return result
        //     })[0],
        // );
        // await waitJobCompletion(job)

        const jobs = values.map(value => runCsvRow(fun, value))
        return jobs
    }
}

// async function runCsvRow(fun: Function, row: Record<string, any>) {
//     var inputValues = Object.keys(fun.inputSchema.properties).reduce((acc, key) => {
//         if (key in row) {
//             acc[key] = row[key];
//         } else {
//             console.warn(`Missing value for input key: ${key}`);
//         }
//         return acc;
//     }, {} as Record<string, any>);
//     inputValues["csv_file_path"] = file.name
//     let job = await FUNCTION_API.runFunction(
//         fun.id as number,
//         JSON.stringify(inputValues)// Convert input values to a comma-separated string with key-value pairs
//     )
//     await waitJobCompletion(job)

// }
// JobCollection did not seem to work well -- move away from it for now
// let jobCollection = await FUNCTION_API.batchRunFunction(
//     fun.id as number,
//     "registered_csv",
//     values.map(value => {
//         var inputValues = Object.keys(fun.inputSchema.properties).reduce((acc, key) => {
//             if (key in value) {
//                 acc[key] = value[key];
//             } else {
//                 console.warn(`Missing value for input key: ${key}`);
//             }
//             return acc;
//         }, {} as Record<string, any>);
//         inputValues["csv_file_path"] = file.name
//         const result = JSON.stringify(inputValues)// Convert input values to a comma-separated string with key-value pairs
//         return result
//     }),
// );
// // jobCollection = await JOB_API.getFunctionJob(jobCollection.id)
// console.log(jobCollection)
// await waitJobCompletion(jobCollection)
// }


export function FunctionIndex() {
    const [functions, setFunctions] = useState<Function[]>([]);

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
            .then((() => {
                console.log("Pending: delete all jobs. Not big issue for now though.")
                // FIXME cache is not working; the same "jobs" are getting "run" over and over again
            }))
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
                <Button variant="contained" color="secondary" onClick={async () => {
                    const file = await pickCsv()
                    if (file) {
                        const fun = await registerCsvAsFunction(file);
                        refreshFunctionList()
                        console.log("Displaying changes")
                        // registerCsvValues(file);
                        registerCsvValuesAsFunctionJobs(fun, file)
                        console.log("Jobs Loaded")
                    }
                }}>Load Results from CSV</Button>
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
                            <TableCell>{showInputOutputSchema(item.inputSchema)}</TableCell>
                            <TableCell>{showInputOutputSchema(item.outputSchema)}</TableCell>
                            <TableCell align='right'>{<Button variant="contained" onClick={() => undefined}>Select</Button>}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card >

    );
};

export default FunctionIndex;
