import { useState, useEffect, useContext } from "react";
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
  Paper,
  Button,
  CircularProgress,
  styled,
  Box
} from "@mui/material";
import type { Function } from "../osparc-api-ts-client/models/Function";
import {
  SolverFunction,
  ProjectFunction,
  PythonCodeFunction,
} from "../osparc-api-ts-client/index.ts";
import MMUXContext from "../views/MMUXContext.tsx";
import { listFunctions } from "../utils/function_utils.ts";
import {
  JSONFunctionInputSchema,
  JSONFunctionOutputSchema,
} from "../osparc-api-ts-client";
import { toast } from "react-toastify";

const ActiveRow = styled(TableRow, { shouldForwardProp: (props) => props !== 'active'})<{ active: boolean }>(({ theme, active }) => `
  font-family: inherit;
  font-weight: 900;
  background-color: ${active ? theme.palette.secondary.main : theme.palette.background.default};
`);

const ActiveCell = styled(TableCell, { shouldForwardProp: (props) => props !== 'active'})<{ active: boolean }>(({ theme, active }) => `
  color: ${active ? theme.palette.secondary.contrastText : theme.palette.text.primary};
`);

const TableButton = styled(Button)(({ theme }) => `
  color: ${theme.palette.primary.main};
`);

const VarsHolder = styled("div")`
  max-width: 150px;
  max-height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
`;

export function FunctionList() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(true);
  const [functions, setFunctions] = useState<Function[]>([]);
  const context = useContext(MMUXContext);

  useEffect(() => {
      (async () => {
        try {
          const funs = await listFunctions();
          console.debug("Functions obtained: ", funs);
          setFunctions(funs);
        } catch (error) {
          console.error("Error fetching functions:", error);
          setError(true);
          toast.error("Error fetching functions. Please try again later.");
        }
        setLoading(false);
      })();
  }, []);

  const showInputOutputSchema = (schema: JSONFunctionInputSchema | JSONFunctionOutputSchema) => {
    if (!schema) {
      console.error("Invalid schema:", schema);
      return [];
    }

    const vars = Object.keys(schema.schemaContent.properties);
    const display_vars = vars.map((variable, index) => (
      <span key={index}>
        {variable}
        <br />
      </span>
    ));
    return (
      <VarsHolder title={schema ? vars.join(", ") : ""}>
        {display_vars}
      </VarsHolder>
    );
  }

  const getFunctionSolver = (fun: Function) => {
    console.log(fun);
    if ((fun as SolverFunction).solverKey) {
      return (
        (fun as SolverFunction).solverKey.split("/").slice(-1)[0] +
        ":" +
        (fun as SolverFunction).solverVersion
      );
    } else if ((fun as ProjectFunction).projectId) {
      return "Template " + (fun as ProjectFunction).projectId;
    } else if ((fun as PythonCodeFunction).codeUrl) {
      return (fun as PythonCodeFunction).codeUrl;
    } else {
      return "Unknown";
    }
  };

  if(loading) {
    return <Box textAlign={'center'}><CircularProgress /></Box>
  }

  if(error) {
    return <Box textAlign={'center'}>No jobs available. Please try again later.</Box>
  }

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
          <TableCell/>
        </TableRow>
      </TableHead>
      <TableBody>
        {functions.map((fun) => (
          <ActiveRow key={fun.uid} active={context?.selectedFunction?.uid === fun.uid}>
            <ActiveCell active={context?.selectedFunction?.uid === fun.uid}>{fun.title}</ActiveCell>
            <ActiveCell active={context?.selectedFunction?.uid === fun.uid}>{fun.description}</ActiveCell>
            <ActiveCell active={context?.selectedFunction?.uid === fun.uid}>{showInputOutputSchema(fun.inputSchema)}</ActiveCell>
            <ActiveCell active={context?.selectedFunction?.uid === fun.uid}>{showInputOutputSchema(fun.outputSchema)}</ActiveCell>
            <ActiveCell active={context?.selectedFunction?.uid === fun.uid}>{getFunctionSolver(fun)}</ActiveCell>
            <ActiveCell align='right' active={context?.selectedFunction?.uid === fun.uid}>
              <TableButton variant="contained" onClick={() => context?.setSelectedFunction(fun)}>
                  Select
              </TableButton>
            </ActiveCell>
          </ActiveRow>
        ))}
      </TableBody>
    </Table>
  );
}
