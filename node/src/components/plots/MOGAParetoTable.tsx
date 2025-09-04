import { useEffect, useState } from "react";
import { Typography, Button, Box, Chip, Popover, Slider } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";
import { useMMUXContext } from "../../context/MMUXContext";

interface MogaParetoTableProps {
  tableData: MogaDataType | undefined;
}

function getRowId(value: MogaDataRowType) {
  return value.NDI;
}

function MogaParetoTable({ tableData }: MogaParetoTableProps) {
  const { weights, setWeights, sortModel, setSortModel } = useMMUXContext();
  const [data, setData] = useState<MogaDataType | undefined>(undefined);
  const [localWeights, setLocalWeights] = useState(weights || {});
  const [loading, setLoading] = useState(true);
  const [anchorElms, setAnchorElms] = useState<{
    [key: string]: HTMLButtonElement | null;
  }>({});
  const [localSortModel, setLocalSortModel] = useState<GridSortModel>(
    sortModel || [
      {
        field: "Performance",
        sort: "desc",
      },
    ],
  );

  const handleWeightsChange = (key: string, newValue: number) => {
    const newWeights = { ...localWeights, [key]: newValue };
    setWeights(newWeights);
    setLocalWeights(newWeights);
  };

  const handleSortModelChange = (model: GridSortModel) => {
    setSortModel(model);
    setLocalSortModel(model);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, key: string) => {
    setAnchorElms(prev => ({ ...prev, [key]: event.currentTarget }));
  };

  const handleClose = (key: string) => {
    setAnchorElms(prev => ({ ...prev, [key]: null }));
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
        maxWidth: 90,
        headerName: key.toUpperCase(),
        type: "number",
        renderCell: params => params.row[key],
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
          renderHeader: () => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle2">{key.toUpperCase()}</Typography>
              <Chip
                label={(localWeights[key] ?? 0).toFixed(2)}
                size="small"
                color="primary"
                onClick={e => handleClick(e as unknown as React.MouseEvent<HTMLButtonElement>, key)}
              />
              <Popover
                id={`popover-${key}`}
                sx={{
                  "& .MuiPaper-root": {
                    width: "280px",
                    padding: "8px 16px",
                    display: "flex",
                    boxShadow: "none",
                  },
                }}
                open={Boolean(anchorElms[key])}
                anchorEl={anchorElms[key]}
                onClose={() => handleClose(key)}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
                transformOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
              >
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Adjust Weight for {key.toUpperCase()}
                  </Typography>
                  <Slider
                    value={localWeights[key]}
                    sx={{ width: 240 }}
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={0.5}
                    onChange={(_event, newValue) => {
                      setLocalWeights(prev => ({ ...prev, [key]: newValue }));
                    }}
                    onChangeCommitted={() => {
                      handleWeightsChange(key, localWeights[key]);
                    }}
                    valueLabelDisplay="auto"
                    aria-labelledby={`slider-${key}`}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Adjust the weight for {key.toUpperCase()} to influence the Pareto front.
                  </Typography>
                </Box>
              </Popover>
            </Box>
          ),
          renderCell: params => params.row[key],
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

  console.log("Table data:", tableData);

  return (
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
      }}
      sortModel={localSortModel}
      onSortModelChange={handleSortModelChange}
      disableColumnMenu
      disableColumnSelector
      disableRowSelectionOnClick
    />
  );
}

export default MogaParetoTable;
