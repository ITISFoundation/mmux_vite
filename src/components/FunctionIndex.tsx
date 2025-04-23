import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, TableRow, TableCell, TableBody, TableHead, Paper, Button } from "@mui/material";
import { FunctionApi, FunctionJobApi, ServerConfiguration, createConfiguration, Function, FunctionJob, FunctionJobCollection } from '../functions-api-ts-client';

const PYTHON_DAKOTA_BACKEND = 'http://127.0.0.1:5000'
const CONFIGURATION_FUNCTION_API = createConfiguration(
    { baseServer: new ServerConfiguration('http://127.0.0.1:8087', {}) }
)
const FUNCTION_API = new FunctionApi(CONFIGURATION_FUNCTION_API);
const JOB_API = new FunctionJobApi(CONFIGURATION_FUNCTION_API)

function FunctionIndex() {
    const [functions, setFunctions] = useState<Function[]>([]);

    async function findFunction(name: string): Promise<Function> {
        // FIXME avoid registering duplicate functions should be in the API
        // this is a temporary patch
        const funs = await FUNCTION_API.searchFunctionsByName(name)
        if (funs.length !== 1) {
            console.error(`Expected exactly 1 function, but found ${funs.length}`);
        }
        const fun = funs[0]
        console.log("funId: ", fun.id);
        console.log("fun: ", fun)
        return fun
    }

    async function pickCsv(): Promise<File> {
        let selectedFile: File | null = null;
        console.log("start")
        const inputElement = document.createElement('input');
        inputElement.type = 'file';
        inputElement.accept = '.csv';

        inputElement.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                selectedFile = file;
                setCsvFile(file)
            } else {
                console.error("No file selected");
                return;
            }
        };

        inputElement.click();

        // Busy-wait until the file is selected
        while (selectedFile === null) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return selectedFile;
    }

    async function registerCsv(file: File) {
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
            console.log(response)

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
            const fun = await findFunction(file.name)
            console.log("Function registered successfully with id: ", fun.id);
            refreshFunctionList()
            console.log("Displaying changes")
            registerCsvValues(file)
            console.log("Jobs Loaded")
            return fun;
        } catch (error) {
            console.error("Error processing file:", error);
        }
    };


    async function readCsvData(file: File): Promise<[string[], string[][]]> {
        const csvData = await file.text();
        const rows = csvData.split("\n").map(row => row.split(","));
        const headers = rows[0];
        rows.shift(); // Remove the first row (headers) from the rows list
        if (rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") {
            rows.pop(); // Remove the last row if it's an empty line
        }
        return [headers, rows]
    }
    async function registerCsvValues(file: File) {
        if (!file) {
            console.error("No file selected");
            return;
        }
        const data = await readCsvData(file)
        const headers = data[0]
        const rows = data[1]

        const values = rows.map(row => {
            return headers.reduce((acc, header, index) => {
                acc[header] = parseFloat(row[index]) || row[index];
                return acc;
            }, {} as Record<string, any>);
        });
        const fun = await findFunction(file.name)

        let job = await FUNCTION_API.runFunction(
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
                const result = JSON.stringify(inputValues)// Convert input values to a comma-separated string with key-value pairs
                return result
            })[0],
        );
        await waitJobCompletion(job)

        // values.map(value => runCsvRow(fun, value))
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

    async function waitJobCompletion(job: FunctionJob | FunctionJobCollection): Promise<string> {
        let jobStatus = await getJobStatus(job)
        while (!jobStatus.includes("COMPLETED") && !jobStatus.includes("FAILED")) {
            console.log(`Job status: ${jobStatus}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep for 1 second
            jobStatus = await getJobStatus(job);
        }
        console.log(jobStatus, job) // for some reason, JobCollection status is not updated, Job is
        return jobStatus
    }

    async function getJobStatus(job: FunctionJob | FunctionJobCollection): Promise<string> {
        const jobId = job.id
        if (!jobId) {
            console.log("jobId not found")
            throw new Error("Job ID not found in the provided job object.");
        }
        let response = await JOB_API.getJobsStatus([jobId])
        let jobStatus = response[0]?.status ?? "UNKNOWN";
        console.log("Job status: ", jobStatus)
        return jobStatus
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
                        registerCsv(file);
                        // registerCsvValues(file);
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
