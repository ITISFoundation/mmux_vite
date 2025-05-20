import React, { useState, useEffect, useContext } from 'react';
import { Table, TableRow, TableCell, TableBody, TableHead, Paper, Button } from "@mui/material";
import type { Function } from '../osparc-api-ts-client/models/Function';
import { SolverFunction, ProjectFunction, PythonCodeFunction } from '../osparc-api-ts-client/index.ts';
import MMUXContext from '../views/MMUXContext.tsx';
import { listFunctions } from './function_utils.ts';
import { JSONFunctionInputSchema, JSONFunctionOutputSchema } from '../osparc-api-ts-client';

export function FunctionList(props: { functions: Function[] } = { functions: [] }) {
    const [functions, setFunctions] = useState<Function[]>([]);
    const context = useContext(MMUXContext);

    useEffect(() => {
        if (props.functions.length === 0) {
            // Fetch functions only if none are passed in props
            (async () => {
                // let funs2 = await FUNCTION_API.listFunctions();
                console.debug("Fetching functions through Python API");
                const funs = await listFunctions();
                console.debug("Functions obtained: ", funs);
                setFunctions(funs);
            })();
        } else {
            console.debug("Functions passed in", props.functions);
            setFunctions(props.functions);
        }
    }, [props.functions]); // Dependency array ensures this runs only when props.functions changes

    function showInputOutputSchema(schema: JSONFunctionInputSchema | JSONFunctionOutputSchema) {

        if (!schema) {
            console.error("Invalid schema:", schema);
            return [];
        }

        const vars = Object.keys(schema.schemaContent.properties);
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
    const getFunctionSolver = (fun: Function) => {
        console.log(fun)
        if ((fun as SolverFunction).solverKey) {
            return (fun as SolverFunction).solverKey.split("/").slice(-1)[0] + ":" + (fun as SolverFunction).solverVersion;
        } else if ((fun as ProjectFunction).projectId) {
            return "Template " + (fun as ProjectFunction).projectId;
        } else if ((fun as PythonCodeFunction).codeUrl) {
            return (fun as PythonCodeFunction).codeUrl;
        } else {
            return "Unknown";
        }
    };

    // Maybe modularize as Cards (instead of Table) ?
    return (
        <Table component={Paper}>
            <TableHead>
                <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Inputs</TableCell>
                    <TableCell>Outputs</TableCell>
                    <TableCell>Solver / Template</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {functions.map(fun => (
                    <TableRow
                        key={fun.uid}
                        sx={{ fontWeight: fun.uid === context?.selectedFunction?.uid ? 'bold' : 'normal', backgroundColor: fun.uid === context?.selectedFunction?.uid ? '#f0f0f0' : 'inherit' }}
                    >
                        <TableCell>{fun.title}</TableCell>
                        <TableCell>{fun.description}</TableCell>
                        <TableCell>{showInputOutputSchema(fun.inputSchema)}</TableCell>
                        <TableCell>{showInputOutputSchema(fun.outputSchema)}</TableCell>
                        {/* <TableCell>{<Button variant="contained" onClick={() => showJobList(fun)}>Show Jobs</Button>}</TableCell> */}
                        <TableCell>{getFunctionSolver(fun)}</TableCell>
                        <TableCell align='right'>{<Button variant="contained" onClick={() => context?.setSelectedFunction(fun)}>Select</Button>}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

