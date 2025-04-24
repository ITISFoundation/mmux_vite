import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, TableRow, TableCell, TableBody, TableHead, Paper, Button } from "@mui/material";
import { Function, FunctionJob, FunctionJobCollection } from '../functions-api-ts-client';
import { FUNCTION_API, JOB_API, PYTHON_DAKOTA_BACKEND } from './api_objects';
import { findFunction, waitJobCompletion, createInputOutputSchema } from './function_utils';
import { pickCsv, readCsvData } from './csv_utils.ts'

export async function registerCsvAsFunction(file: File, name?: string): Promise<Function> {
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
        + '/flask/get_nih_inputs_outputs' // TODO eventually generalize this
        //  (w popup window that allows to select what is input, what is output)
        + "?filename=" + file.name
    );
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const body = await response.text();
    const data: { input_vars: string[]; output_vars: string[] } = JSON.parse(body);

    await FUNCTION_API.createFunction(
        {
            "name": name ?? file.name,
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
};

export async function registerCsvValuesAsFunctionJobs(fun: Function, file: File): Promise<FunctionJob[]> {
    const { headers, rows } = await readCsvData(file)
    const values = rows.map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = parseFloat(row[index]) || row[index];
            return acc;
        }, {} as Record<string, any>);
    });

    async function runCsvRow(fun: Function, file: File, row: Record<string, any>): Promise<FunctionJob> {
        var inputValues = Object.keys(fun.inputSchema.properties).reduce((acc, key) => {
            if (key in row) {
                acc[key] = row[key];
            } else {
                console.warn(`Missing value for input key: ${key}`);
            }
            return acc;
        }, {} as Record<string, any>);
        inputValues["csv_file_path"] = file.name
        let job = await FUNCTION_API.runFunction(
            fun.id as number,
            JSON.stringify(inputValues)// Convert input values to a comma-separated string with key-value pairs
        )
        // await waitJobCompletion(job)
        return job
    }
    const jobs = await Promise.all(values.map(value => runCsvRow(fun, file, value)));
    return jobs
}

// export async function registerCsvValuesAsFunctionJobCollection(fun: Function, file: File, name?: string): Promise<FunctionJobCollection> {
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
// }

export function FunctionIndex() {
    const [functions, setFunctions] = useState<Function[]>([]);

    function refreshFunctionList() {
        FUNCTION_API.listFunctions()
            .then(response => {
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

    // TODO improve; make a list similar visually to that of Functions
    async function showJobList(fun: Function) {
        if (typeof fun.id === "number") {
            let jobList = await JOB_API.getFunctionJobs(fun.id)
            if (jobList.length === 0) {
                window.alert(`No jobs available for function "${fun.name}" with id "${fun.id}".`);
            }
            const jobListWindow = window.open("", "Job List", "width=600,height=400");
            if (jobListWindow) {
                jobListWindow.document.write("<html><head><title>Job List</title></head><body>");
                jobListWindow.document.write("<h1>Job List</h1>");
                jobList.forEach(job => {
                    jobListWindow.document.write(`<p>Job ID: ${job.id}, Status: ${job.status}</p>`);
                });
                jobListWindow.document.write("<button onclick='window.close()'>Close</button>");
                jobListWindow.document.write("</body></html>");
                // jobListWindow.document.close();
                // return;
            } else {
                console.error("Failed to open job list window.");
            }
        } else {
            console.error("The function provided does not have a valid ID")
        }


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
                        await registerCsvValuesAsFunctionJobs(fun, file)
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
                    {functions.map(fun => (
                        <TableRow key={fun.id}>
                            <TableCell>{fun.id}</TableCell>
                            <TableCell>{fun.name}</TableCell>
                            <TableCell>{showInputOutputSchema(fun.inputSchema)}</TableCell>
                            <TableCell>{showInputOutputSchema(fun.outputSchema)}</TableCell>
                            <TableCell>{<Button variant="contained" onClick={() => showJobList(fun)}>Show Jobs</Button>}{ }</TableCell>
                            <TableCell align='right'>{<Button variant="contained" onClick={() => undefined}>Select</Button>}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card >

    );
};

export default FunctionIndex;
