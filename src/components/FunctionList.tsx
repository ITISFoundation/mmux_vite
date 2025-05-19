import React, { useState, useEffect, useContext } from 'react';
import { Card, Typography, Table, TableRow, TableCell, TableBody, TableHead, Paper, Button } from "@mui/material";
import { Function, FunctionJob } from '../osparc-api-ts-client/index.ts';
import { FUNCTION_API, JOB_API, PYTHON_DAKOTA_BACKEND } from './api_objects.ts';
import MMUXContext from '../views/MMUXContext.tsx';


export function FunctionList(props: { functions: Function[] } = { functions: [] }) {
    const [functions, setFunctions] = useState<Function[]>([]);
    const context = useContext(MMUXContext);

    useEffect(() => {
        if (props.functions.length === 0) {
            // Fetch functions only if none are passed in props
            (async () => {
                const funs = await FUNCTION_API.listFunctions();
                console.debug("Functions obtained: ", funs);
                setFunctions(funs);
            })();
        } else {
            console.debug("Functions passed in", props.functions);
            setFunctions(props.functions);
        }
    }, [props.functions]); // Dependency array ensures this runs only when props.functions changes

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


    // Maybe modularize as Cards (instead of Table) ?
    return (
        <Table component={Paper}>
            <TableHead>
                <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Inputs</TableCell>
                    <TableCell>Outputs</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {functions.map(fun => (
                    <TableRow
                        key={fun.id}
                        sx={{ fontWeight: fun.id === context?.selectedFunction?.id ? 'bold' : 'normal', backgroundColor: fun.id === context?.selectedFunction?.id ? '#f0f0f0' : 'inherit' }}
                    >
                        <TableCell>{fun.id}</TableCell>
                        <TableCell>{fun.name}</TableCell>
                        <TableCell>{showInputOutputSchema(fun.inputSchema)}</TableCell>
                        <TableCell>{showInputOutputSchema(fun.outputSchema)}</TableCell>
                        <TableCell>{<Button variant="contained" onClick={() => showJobList(fun)}>Show Jobs</Button>}</TableCell>
                        <TableCell align='right'>{<Button variant="contained" onClick={() => context?.setSelectedFunction(fun)}>Select</Button>}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

