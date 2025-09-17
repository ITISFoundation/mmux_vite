import { useEffect, useState } from "react";
import { EditAttributes } from "@mui/icons-material";
import { Typography, Button, Box, IconButton } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";
import { useMMUXContext } from "../../context/MMUXContext";
import PerformanceModal from "./PerformanceModal";
import Header from "../navigation/Header";

interface MogaParetoTableProps {
  tableData: MogaDataType | undefined;
  hovered: number | null;
  setHovered: (x: number | null) => void;
}

function getRowId(value: MogaDataRowType) {
  return value.NDI;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MogaParetoTable({ tableData, hovered, setHovered }: MogaParetoTableProps) {
  const { weights, setWeights, sortModel, setSortModel } = useMMUXContext();
  const [data, setData] = useState<MogaDataType | undefined>(undefined);
  const [localWeights, setLocalWeights] = useState(weights || {});
  const [loading, setLoading] = useState(true);
  const [openPerformanceModal, setOpenPerformanceModal] = useState(false);
  const [localSortModel, setLocalSortModel] = useState<GridSortModel>(
    sortModel || [
      {
        field: "Performance",
        sort: "desc",
      },
    ],
  );

  const handleWeightsChange = (updatedWeights: typeof localWeights) => {
    console.log("setting weights!", updatedWeights);
    setWeights(updatedWeights);
    setLocalWeights(updatedWeights);
  };

  const handleSortModelChange = (model: GridSortModel) => {
    setSortModel(model);
    setLocalSortModel(model);
  };

  useEffect(() => {
    // Simulate loading data
    setData(tableData);
    if (weights === undefined || Object.keys(weights).length === 0) {
      const outputKeys: string[] = tableData?.outputs || [];
      const generatedWeights: { [key: string]: number } = {};
      for (let i = 0; i < outputKeys.length; i += 1) {
        generatedWeights[outputKeys[i]] = 0.5; // Example weight, can be adjusted
      }
      setLocalWeights(generatedWeights);
      setWeights(generatedWeights);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  const columnProps: Partial<GridColDef> = {
    headerAlign: "center",
    align: "center",
    flex: 1,
    sortable: true,
  };

  let columns: GridColDef[] = data
    ? data.inputs.map(key => ({
        ...columnProps,
        field: key,
        maxWidth: 120,
        headerName: key.toUpperCase(),
        type: "number",
        renderCell: params => params.row[key].toFixed(3),
        valueGetter: (_value, row) => row[key],
      }))
    : [];

  columns = columns.concat(
    data
      ? data.outputs.map(key => ({
          ...columnProps,
          field: key,
          headerName: key.toUpperCase(),
          type: "number",
          renderCell: params => params.row[key].toFixed(3),
          valueGetter: (_value, row) => row[key],
        }))
      : [],
  );

  columns = columns.concat([
    {
      ...columnProps,
      field: "performance",
      headerName: "Performance",
      minWidth: 105,
      maxWidth: 105,
      type: "number",
      renderHeader: () => (
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.5 }}>
          <IconButton onClick={() => setOpenPerformanceModal(true)} size="small">
            <EditAttributes />
          </IconButton>
          <Typography variant="body2">Performance</Typography>
        </Box>
      ),
      renderCell: params => params.row.Performance.toFixed(2),
      valueGetter: (_value, row) => row.Performance,
    },
    {
      ...columnProps,
      field: "action",
      headerName: "",
      minWidth: 95,
      maxWidth: 95,
      type: "actions",
      sortable: false,
      renderCell: () => (
        <Button variant="contained" color="primary">
          Show
        </Button>
      ),
    },
  ]);

  return (
    <>
      <Header tabTitle="Pareto-Optimal MOGA Samples" headerType="subTitle" infoText="Explore the pareto-optimal solutions" />
      <DataGrid
        rows={data?.rows || []}
        columns={columns}
        sx={theme => ({
          borderRadius: theme.spacing(2),
          overflow: "hidden",
          fontFamily: "inherit",
          padding: "0px 8px",
          "& .MuiDataGrid-cell": {
            fontWeight: 400,
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.mode === "dark" ? "black" : "white"}`,
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 70%, ${theme.palette.mode === "dark" ? "black" : "white"}`,
          },
          "& .MuiDataGrid-row.Mui-selected:hover": {
            backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.mode === "dark" ? "black" : "white"}`,
          },
          "& .MuiDataGrid-sortButton": {
            backgroundColor: theme.palette.background.paper,
          },
        })}
        getRowId={getRowId}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
          filter: {
            filterModel: {
              items: [],
            },
          },
        }}
        pageSizeOptions={[5, 10, 20, 50]}
        loading={loading}
        slotProps={{
          loadingOverlay: {
            variant: "linear-progress",
            noRowsVariant: "linear-progress",
          },
          row: {
            onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
              const rowData = event.currentTarget!.dataset;
              setHovered(Number(rowData.id));
            },
            onMouseLeave: () => {
              setHovered(null);
            },
          },
        }}
        sortModel={localSortModel}
        onSortModelChange={handleSortModelChange}
        disableColumnMenu
        disableColumnSelector
        disableRowSelectionOnClick
      />
      <PerformanceModal
        open={openPerformanceModal}
        setOpen={setOpenPerformanceModal}
        weights={localWeights}
        onChange={handleWeightsChange}
      />
    </>
  );
}

export default MogaParetoTable;
