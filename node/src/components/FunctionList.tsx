import { useState, useEffect } from "react";
import { styled, Box, IconButton, Typography, useTheme, Button } from "@mui/material";
import { toast } from "react-toastify";
import { Refresh } from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import type { Function } from "../osparc-api-ts-client/models/Function";
import {
  SolverFunction,
  ProjectFunction,
  PythonCodeFunction,
} from "../osparc-api-ts-client/index.ts";
import { listFunctions, getFunctionJobCollections } from "../utils/function_utils.ts";
import {
  JSONFunctionInputSchema,
  JSONFunctionOutputSchema,
} from "../osparc-api-ts-client";
import { useMMUXContext } from "../context/MMUXContext.tsx";

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
  const theme = useTheme();
  const { selectedFunction, setSelectedFunction, setInputVars, setOutputVars } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [functions, setFunctions] = useState<Function[]>([]);
  const [jobCollectionCount, setJobCollectionCount] = useState<{[key: string]:number}>({});
  const [jobCount, setJobCount] = useState<{[key: string]:number}>({});
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: "include", ids: new Set() });

  const fetchJobJobCollectionCount = async (fun: Function) => {
    try {
      const jcs = await getFunctionJobCollections(fun.uid);
      const jc_length = jcs.length;
      const j_length = jcs.map(jc => { return jc.jobIds ? jc.jobIds.length : 0 }).reduce((a, b) => a + b, 0);
      return {
        "Function Uid": fun.uid,
        "Job Collection Count": jc_length,
        "Job Count": j_length
      }
    } catch (err) {
      console.warn("Error fetching job count for Function ", fun.uid)
      console.error(err);
    }
  };

  const fetchFunctions = async () => {
    try {
      setLoading(true);
      const funs = await listFunctions();
      setFunctions(funs);
      if (funs.length === 0) {
        toast.info("No functions available. Please create a function first.");
      } else {
        const fetchedCounts = await Promise.all(funs.map((fun) => fetchJobJobCollectionCount(fun)));
        const jcCount: { [key: string]: number } = {};
        const jCount: { [key: string]: number } = {};
        fetchedCounts.forEach((item) => {
          if (item) {
            jcCount[item["Function Uid"]] = item["Job Collection Count"];
            jCount[item["Function Uid"]] = item["Job Count"];
          }
        });
        setJobCollectionCount(jcCount);
        setJobCount(jCount);
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
    if ((fun as SolverFunction).solverKey) {
      return (
        (fun as SolverFunction).solverKey.split("/").slice(-1)[0] +
        ":" +
        (fun as SolverFunction).solverVersion
      );
    } else if ((fun as ProjectFunction).projectId) {
      const handleInfoClick = () => {
        // Send a postMessage to the parent iframe
        window.parent.postMessage(
          {
            type: "openFunction",
            message: {
              functionId: (fun as ProjectFunction).projectId,
            },
          },
          "*"
        );
      };

      return (
        <IconButton
          size="small"
          onClick={handleInfoClick}
          sx={{ color: `${theme.palette.primary.main}` }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      );
    } else if ((fun as PythonCodeFunction).codeUrl) {
      return (fun as PythonCodeFunction).codeUrl;
    } else {
      return "Unknown";
    }
  };

  const NFunctionJobCollections = (props: { fun: Function }): React.ReactNode => {
    const fun = props.fun;
    return (
      <Box>
        {jobCollectionCount[fun.uid] === undefined || jobCount[fun.uid] === undefined
          ? "Loading..."
          : `Campaigns: ${jobCollectionCount[fun.uid]} (${jobCount[fun.uid]} total evaluations)`}
      </Box>
    );
  }

  function getRowId(row: Function) {
    return row.uid ? row.uid : "" + row.title + row.description;
  }

  const handleRowSelection = (newRowSelectionModel: GridRowSelectionModel) => {
    setRowSelectionModel(newRowSelectionModel);
    if (newRowSelectionModel.ids.size > 0) {
      const selectedRow = functions.find((row) =>
        getRowId(row) === newRowSelectionModel.ids.values().next().value
      );
      if (selectedRow) {
        setSelectedFunction(selectedRow);
        setInputVars(
          selectedRow.inputSchema?.schemaContent?.properties
            ? Object.keys(
                selectedRow.inputSchema.schemaContent.properties
              )
            : []
        );
        console.log(
          "inputVars registered:",
          Object.keys(selectedRow.inputSchema.schemaContent.properties)
        );
        setOutputVars(
          selectedRow.outputSchema?.schemaContent?.properties
            ? Object.keys(
                selectedRow.outputSchema.schemaContent.properties
              )
            : []
        );
      }
    } else {
      setSelectedFunction(undefined);
      setInputVars([]);
      setOutputVars([]);
    }
  };

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
          Error fetching functions from the server. Please try again after some time.
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
        handleRowSelection(newRowSelectionModel);
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
          field: "n_evaluations",
          headerName: "# Campaigns / Evaluations",
          flex: 1,
          minWidth: 250,
          renderCell: (params) => <NFunctionJobCollections fun={params.row} />,
          // FIXME for some reason, this gets called many times
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
            <Button
              variant="contained"
              onClick={() => {
                setSelectedFunction(params.row);
                setInputVars(
                  params.row.inputSchema?.schemaContent?.properties
                    ? Object.keys(
                        params.row.inputSchema.schemaContent.properties
                      )
                    : []
                );
                console.log(
                  "inputVars registered:",
                  Object.keys(params.row.inputSchema.schemaContent.properties)
                );
                setOutputVars(
                  params.row.outputSchema?.schemaContent?.properties
                    ? Object.keys(
                        params.row.outputSchema.schemaContent.properties
                      )
                    : []
                );
              }}
            >
              Select
            </Button>
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
          backgroundColor: (theme) =>
            `color-mix(in srgb, ${theme.palette.primary.main} 70%, ${
              theme.palette.mode === "dark" ? "black" : "white"
            })`,
        },
        "& .MuiDataGrid-row.Mui-selected:hover": {
          backgroundColor: (theme) =>
            `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${
              theme.palette.mode === "dark" ? "black" : "white"
            })`,
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
