import { useState, useEffect } from "react";
import { Button, styled, Box, IconButton, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { Refresh } from "@mui/icons-material";
import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import type { Function } from "../osparc-api-ts-client/models/Function";
import {
  SolverFunction,
  ProjectFunction,
  PythonCodeFunction,
} from "../osparc-api-ts-client/index.ts";
import { listFunctions } from "../utils/function_utils.ts";
import {
  JSONFunctionInputSchema,
  JSONFunctionOutputSchema,
} from "../osparc-api-ts-client";
import { useMMUXContext } from "../context/MMUXContext.tsx";

const TableButton = styled(Button)(
  ({ theme }) => `
  color: ${theme.palette.primary.main};
`
);

const VarsHolder = styled("div")`
  max-width: 150px;
  max-height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  display: flex;
  gap: 16px;
`;

export function FunctionList() {
  const { selectedFunction, setSelectedFunction, setInputVars, setOutputVars} = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [functions, setFunctions] = useState<Function[]>([]);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  const fetchFunctions = async () => {
    try {
      setLoading(true);
      const funs = await listFunctions();
      setFunctions(funs);
      if (funs.length === 0) {
        toast.info("No functions available. Please create a function first.");
      }
      setError(false);
    } catch (error) {
      console.error("Error fetching functions:", error);
      setError(true);
      toast.error("Error fetching functions. Please try again later.");
    }
    setLoading(false);
  };

  const showInputOutputSchema = (
    schema: JSONFunctionInputSchema | JSONFunctionOutputSchema
  ) => {
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
  };

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

  function getRowId(row: Function) {
    return row.uid ? row.uid : "" + row.title + row.description;
  }

  useEffect(() => {
    console.log("FunctionList mounted, fetching functions...");
    (async () => {
      await fetchFunctions();
    })();
  }, []);

  useEffect(() => {
    console.log("Selected function changed:", selectedFunction);
    if (selectedFunction) {
      rowSelectionModel.ids.add(getRowId(selectedFunction));
    }
  }, [rowSelectionModel.ids, selectedFunction]);

  if (error) {
    return (
      <Box textAlign={"center"}>
        <Typography
          variant="body1"
          fontFamily={"inherit"}
          fontSize={"1.2em"}
          fontWeight={300}
          display="inline"
          mr={1}
        >
          No functions available.
        </Typography>
        <IconButton size="small" onClick={async () => await fetchFunctions()}>
          <Refresh color="primary" />
        </IconButton>
      </Box>
    );
  }

  return (
    <DataGrid
      onRowSelectionModelChange={(newRowSelectionModel) => {
        setRowSelectionModel(newRowSelectionModel);
      }}
      rowSelectionModel={rowSelectionModel}
      rows={functions}
      columns={[
        { field: "title", headerName: "Title", flex: 1, maxWidth: 200 },
        {
          field: "description",
          headerName: "Description",
          flex: 1,
          maxWidth: 400,
        },
        {
          field: "inputSchema",
          headerName: "Inputs",
          flex: 1,
          maxWidth: 100,
          renderCell: (params) => showInputOutputSchema(params.row.inputSchema),
        },
        {
          field: "outputSchema",
          headerName: "Outputs",
          flex: 1,
          maxWidth: 100,
          renderCell: (params) =>
            showInputOutputSchema(params.row.outputSchema),
        },
        {
          field: "solverKey",
          headerName: "Solver / Template",
          flex: 1,
          minWidth: 200,
          renderCell: (params) => getFunctionSolver(params.row),
        },
        {
          field: "actions",
          headerName: "",
          sortable: false,
          flex: 0.5,
          maxWidth: 100,
          minWidth: 100,
          renderCell: (params) => (
            <TableButton
              variant="contained"
              onClick={() => {
                setSelectedFunction(params.row);
                setInputVars(
                    params.row.inputSchema?.schemaContent?.properties
                        ? Object.keys(params.row.inputSchema.schemaContent.properties)
                        : []
                );
                console.log("inputVars registered:", Object.keys(params.row.inputSchema.schemaContent.properties))
                setOutputVars(
                    params.row.outputSchema?.schemaContent?.properties
                        ? Object.keys(params.row.outputSchema.schemaContent.properties)
                        : []
                );
              }}
            >
              Select
            </TableButton>
          ),
        },
      ]}
      sx={{
        borderRadius: "8px",
        overflow: "hidden",
        fontFamily: "inherit",
        padding: "0px 8px",
        "& .MuiDataGrid-cell": {
          fontWeight: 400,
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: (theme) =>
            `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${
              theme.palette.mode === "dark" ? "black" : "white"
            })`,
        },
        "& .MuiDataGrid-row.Mui-selected": {
          backgroundColor: (theme) => theme.palette.primary.main,
        },
        "& .MuiDataGrid-row.Mui-selected:hover": {
          backgroundColor: (theme) => theme.palette.primary.main,
        },
        "& .MuiDataGrid-sortButton": {
          backgroundColor: (theme) => theme.palette.background.paper,
        },
      }}
      onRowClick={(params) => setSelectedFunction(params.row)}
      getRowId={getRowId}
      showToolbar
      initialState={{
        pagination: {
          paginationModel: { pageSize: 10 },
        },
        sorting: {
          sortModel: [{ field: "title", sort: "asc" }],
        },
        filter: {
          filterModel: {
            items: [],
          },
        },
      }}
      pageSizeOptions={[5, 10, 20, 50]}
      loading={loading}
      disableColumnMenu
      disableColumnSelector
    ></DataGrid>
  );
}
