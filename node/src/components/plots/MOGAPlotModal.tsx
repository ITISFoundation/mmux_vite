import React, { useState } from "react";
import { Box, Button, Card, CardActions, CardContent, InputLabel, Modal, Typography, useTheme } from "@mui/material";
import { ShowChart } from "@mui/icons-material";
import { FunctionJob } from "../../osparc-api-ts-client";
import { CustomAnimatedToggle } from "../utils/CustomAnimatedToggle";
import Header from "../navigation/Header";
import { OutputSelect } from "./PlotTools";

interface MOGAPlotModalProps {
  plotType: PlotConfig | undefined;
  tableData: MogaDataType | undefined;
  updatePlot: (
    jobs: FunctionJob[],
    localTableData: MogaDataType,
    extPlotType?: PlotConfig,
    extSelectedOptVars?: string[],
  ) => void;
  filteredJobList: FunctionJob[];
  optVars: string[];
  selectedOptVars: string[];
  setSelectedOptVars: (vars: string[]) => void;
}

export const MOGAPlotModal = (props: MOGAPlotModalProps) => {
  const { plotType, tableData, updatePlot, filteredJobList, optVars, selectedOptVars, setSelectedOptVars } = props;
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [localPlotType, setLocalPlotType] = useState<PlotConfig>(plotType || { dimensionType: "2D", scaleType: "linear" });
  const [localSelectedOptVars, setLocalSelectedOptVars] = useState<string[]>(selectedOptVars);
  const dimensions = ["1D", "2D", "3D"];

  const handleSetSelectedOptVars = (idx: number, value: string) => {
    if (localSelectedOptVars) {
      const newSelected = [...localSelectedOptVars];
      newSelected[idx] = value;
      setLocalSelectedOptVars(newSelected);
    }
  };

  const handleSetPlotType = (newPlotType: PlotConfig) => {
    setLocalPlotType(newPlotType);
  };

  const resetFields = () => {
    setLocalPlotType(plotType || { dimensionType: "2D", scaleType: "linear" });
    setLocalSelectedOptVars(selectedOptVars);
  };

  const handleSetData = () => {
    if (localPlotType && localSelectedOptVars) {
      setSelectedOptVars(localSelectedOptVars);
      updatePlot(filteredJobList, tableData!, localPlotType, localSelectedOptVars);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          margin: "auto",
          width: "80%",
          maxWidth: "480px",
          height: "80%",
        }}
      >
        <Card
          sx={{
            overflow: "auto",
            backgroundImage: "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Header headerType="titleNoMargin" tabTitle="Plot Configuration" infoText="Change the plot type and scale." />
          </Box>
          <CardContent
            sx={{
              padding: 0,
              margin: "16px 0px",
              borderRadius: theme.spacing(2),
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", padding: "0px 8px" }}>
              <InputLabel
                size="small"
                sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
              >
                <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                  Plot Scale Type:
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    width: "150px",
                    alignSelf: "flex-end",
                    mb: 1,
                    backgroundColor: theme.palette.background.default,
                    padding: "4px",
                    borderRadius: "32px",
                  }}
                >
                  <CustomAnimatedToggle
                    data={["linear", "log"]}
                    value={localPlotType.scaleType === "linear" ? 0 : 1}
                    onChange={i => {
                      if (localPlotType) {
                        const calculateLog: "linear" | "log" = i === 0 ? "linear" : "log";
                        const newPlotType = { ...localPlotType, scaleType: calculateLog };
                        handleSetPlotType(newPlotType);
                      }
                    }}
                    disabled={[optVars.length === 0, optVars.length === 0]}
                  />
                </Box>
              </InputLabel>
              <InputLabel
                size="small"
                sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
              >
                <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                  Plot Dimension Type:
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    width: "150px",
                    alignSelf: "flex-end",
                    mb: 1,
                    backgroundColor: theme.palette.background.default,
                    padding: "4px",
                    borderRadius: "32px",
                  }}
                >
                  <CustomAnimatedToggle
                    data={dimensions}
                    value={dimensions.findIndex(dim => dim === localPlotType.dimensionType)}
                    onChange={i => {
                      if (localPlotType) {
                        const calculatePT: "1D" | "2D" | "3D" = dimensions[i] as "1D" | "2D" | "3D";
                        const newPlotType = { ...localPlotType, dimensionType: calculatePT };
                        handleSetPlotType(newPlotType);
                      }
                    }}
                    disabled={[!(optVars.length >= 1), !(optVars.length >= 2), !(optVars.length >= 3)]}
                  />
                </Box>
              </InputLabel>
              {dimensions.map((dim, idx) => {
                if (dimensions.findIndex(v => v === localPlotType.dimensionType) < dimensions.findIndex(v => v === dim))
                  return <></>;
                return (
                  <InputLabel
                    key={dim}
                    size="small"
                    sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
                  >
                    <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                      {["X", "Y", "Z"][idx]} Axis:
                    </Typography>
                    <OutputSelect
                      values={optVars}
                      selected={optVars.findIndex(v => v === localSelectedOptVars[idx])}
                      setSelected={v => handleSetSelectedOptVars(idx, v)}
                    />
                  </InputLabel>
                );
              })}
            </Box>
          </CardContent>
          <CardActions sx={{ padding: 0, display: "flex", justifyContent: "space-between" }}>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                resetFields();
                setOpen(false);
              }}
              sx={{ alignItems: "start" }}
            >
              Close
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                handleSetData();
                setOpen(false);
              }}
              sx={{ alignItems: "end" }}
            >
              Apply
            </Button>
          </CardActions>
        </Card>
      </Modal>
      <Box display="flex" justifyContent="end" alignItems="center" marginTop={2}>
        <Button
          variant="contained"
          startIcon={<ShowChart />}
          onClick={() => setOpen(true)}
          disabled={optVars.length === 0}
          sx={{ textTransform: "none", width: "180px", textWrapMode: "nowrap", overflow: "hidden" }}
        >
          PLOT SETTINGS
        </Button>
      </Box>
    </>
  );
};
