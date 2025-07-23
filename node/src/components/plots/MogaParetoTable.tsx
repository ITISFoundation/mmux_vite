import { useEffect, useState } from "react";
import { Typography, Button, Box, Chip, Popover, Slider } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";
import { useMMUXContext } from "../../context/MMUXContext";

interface MogaDataType {
    id: number;
    inputs: {
        w: number;
        x: number;
        y: number;
        z: number;
    };
    outputs: {
        longVar1: number;
        LongVar2: number;
        LongVar3: number;
    };
    Performance: number;
}

const dummyData: MogaDataType[] = [
  {
    id: 1,
    inputs: { w: 1, x: 2, y: 3, z: 4 },
    outputs: { longVar1: 5, LongVar2: 6, LongVar3: 7 },
    Performance: 0.7,
  },
  {
    id: 2,
    inputs: { w: 8, x: 9, y: 10, z: 11 },
    outputs: { longVar1: 12, LongVar2: 13, LongVar3: 14 },
    Performance: 0.8,
  },
  {
    id: 3,
    inputs: { w: 15, x: 16, y: 17, z: 18 },
    outputs: { longVar1: 19, LongVar2: 20, LongVar3: 21 },
    Performance: 0.9,
  },
];

const MogaParetoTable = () => {
  const { weights, setWeights, sortModel, setSortModel } = useMMUXContext();
  const [data, setData] = useState<MogaDataType[]>();
  const [localWeights, setLocalWeights] = useState(weights ? weights : {});
  const [loading, setLoading] = useState(true);
  const [anchorElms, setAnchorElms] = useState<{
    [key: string]: HTMLButtonElement | null;
  }>({});
  const [localSortModel, setLocalSortModel] = useState<GridSortModel>(sortModel || [{
      field: 'Performance',
      sort: 'desc',
    }]);

  const handleWeightsChange = (key: string, newValue: number) => {
    const newWeights = { ...localWeights, [key]: newValue };
    setWeights(newWeights);
    setLocalWeights(newWeights);
  };

  const handleSortModelChange = (model: GridSortModel) => {
    setSortModel(model);
    setLocalSortModel(model);
  };

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    key: string
  ) => {
    setAnchorElms((prev) => ({ ...prev, [key]: event.currentTarget }));
  };

  const handleClose = (key: string) => {
    setAnchorElms((prev) => ({ ...prev, [key]: null }));
  };

  function getRowId(value: MogaDataType) {
    return value.id;
  }

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setData(dummyData);
      if(weights !== undefined && Object.keys(weights).length === 0) {
        const outputKeys: string[] = Object.keys(dummyData[0].outputs);
        const generatedWeights: { [key: string]: number } = {};
        for (let i = 0; i < outputKeys.length; i++) {
          generatedWeights[outputKeys[i]] = 0.5; // Example weight, can be adjusted
        }
        setLocalWeights(generatedWeights);
        setWeights(generatedWeights);
      }
      setLoading(false);
    }, 2000);
  }, []);

  const columnProps: Partial<GridColDef> = {
    headerAlign: "center",
    align: "center",
    flex: 1,
    sortable: true,
  };

  let columns: GridColDef[] = Object.keys(data ? data[0].inputs : {}).map((key) => ({
    ...columnProps,
    field: key,
    maxWidth: 90,
    headerName: key.toUpperCase(),
    type: "number",
    renderCell: (params: any) => params.row.inputs[key],
    valueGetter: (value, row) => row.inputs[key],
  }));

  columns = columns.concat(
    Object.keys(data ? data[0].outputs : {}).map((key) => ({
      ...columnProps,
      field: key,
      headerName: key.toUpperCase(),
      type: "number",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2">{key.toUpperCase()}</Typography>
          <Chip
            label={localWeights[key].toFixed(2)}
            size="small"
            color="primary"
            onClick={(e) => handleClick(e as any, key)}
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
                onChange={(event, newValue) => {
                  setLocalWeights((prev) => ({ ...prev, [key]: newValue }));
                }}
                onChangeCommitted={() => {
                  handleWeightsChange(key, localWeights[key]);
                }}
                valueLabelDisplay="auto"
                aria-labelledby={`slider-${key}`}
              />
              <Typography variant="caption" color="textSecondary">
                Adjust the weight for {key.toUpperCase()} to influence the
                Pareto front.
              </Typography>
            </Box>
          </Popover>
        </Box>
      ),
      renderCell: (params: any) => params.row.outputs[key],
      valueGetter: (value, row) => row.outputs[key],
    }))
  );

  columns = columns.concat([
    {
      ...columnProps,
      field: "performance",
      headerName: "Performance",
      minWidth: 105,
      maxWidth: 105,
      type: "number",
      renderCell: (params: any) => params.row.Performance.toFixed(2),
      valueGetter: (value, row) => row.Performance,
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
    <DataGrid
      rows={data}
      columns={columns}
      sx={(theme) => ({
        borderRadius: theme.spacing(2),
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
    ></DataGrid>
  );
};

export default MogaParetoTable;
