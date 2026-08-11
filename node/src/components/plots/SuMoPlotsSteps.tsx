import React from "react";
import { Box, InputLabel, MenuItem, Select, useTheme } from "@mui/material";
import { InfoOutline } from "@mui/icons-material";
import IsoSurface3DPlot from "./IsoSurface3DPlot";
import Curves1DPlots from "./Curves1DPlot";
import SuMoValidation from "./SuMoValidation";
import Surface2DPlot from "./Surface2DPlot";
import SteppedPlotCard, { type SteppedStep } from "./SteppedPlotCard";
import { filterInputVars } from "./PlotTools";
import CrossValidationDocument from "../documents/CrossValidationDocument";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import SelectQoIDocument from "../documents/SelectQoIDocument";
import CustomTooltip from "../utils/CustomTooltip";
import { useServiceContext } from "../../context/ServiceContext";

function SuMoPlotsSteps() {
  const theme = useTheme();
  const { inputVars, selectedFunction, distribution, outputVars } = useFunctionContext();
  const { selectedQoI, setSelectedQoI } = useMMUXContext();
  const { serviceMode } = useServiceContext();
  const context = useJobContext();
  const { filteredJobList, selectedJobUids } = context;
  const [activeStep, setActiveStep] = React.useState(0);
  const [filteredInputVars, setFilteredInputVars] = React.useState(inputVars);
  const [maxSteps, setMaxSteps] = React.useState(0);
  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const stepDefinitions: SteppedStep[] = [
    {
      title: "Validation",
      infoText: "Assessment of model quality through Cross-Validation",
      extendedInfoText: CrossValidationDocument,
      content: <SuMoValidation />,
    },
    { title: "1D Curves", content: <Curves1DPlots /> },
    { title: "2D Surface", content: <Surface2DPlot /> },
    { title: "3D IsoSurface", content: <IsoSurface3DPlot /> },
  ];

  React.useEffect(() => {
    const jobs = filteredJobList;
    if (jobs.length === 0) {
      // avoid everything disappearing when there are not enough selected jobs
      setFilteredInputVars(inputVars);
    } else {
      setFilteredInputVars(filterInputVars({ ...context, selectedFunction, inputVars, distribution }));
    }
    setMaxSteps(Math.min(filteredInputVars.length + 1, stepDefinitions.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobUids, filteredJobList]);

  const visibleSteps = stepDefinitions.slice(0, maxSteps);
  const gatedContent = (() => {
    if (filteredInputVars.length === 0) return undefined;
    const minVars = activeStep <= 1 ? 0 : activeStep - 1;
    if (filteredInputVars.length <= minVars) return undefined;
    return visibleSteps[activeStep]?.content;
  })();

  const stepsWithGatedContent = visibleSteps.map((step, i) => ({
    ...step,
    content: i === activeStep ? gatedContent : step.content,
  }));

  return (
    <SteppedPlotCard
      steps={stepsWithGatedContent}
      activeStep={activeStep}
      maxSteps={maxSteps}
      onNext={handleNext}
      onBack={handleBack}
      nextTestId="sumo-plot-next"
      backTestId="sumo-plot-back"
      qoiSelector={
        (serviceMode === "MOGA" || serviceMode === "UQ") && (
          <InputLabel
            size="small"
            sx={{
              display: "flex",
              flex: 1,
              transform: "none",
              alignItems: "baseline",
              gap: "8px",
              fontFamily: "inherit",
              fontWeight: 300,
              fontSize: "1.2em",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              Select Quantity of Interest
              <CustomTooltip
                title="Choose the simulation output to analyze"
                extendedTooltip={SelectQoIDocument}
                placement="right"
                arrow
              >
                <InfoOutline
                  sx={{
                    color: theme.palette.primary.light,
                    backgroundColor: theme.palette.background.default,
                    borderRadius: "50%",
                    padding: "2px",
                    marginLeft: "4px",
                  }}
                />
              </CustomTooltip>
            </Box>
            <Select
              size="small"
              variant="outlined"
              sx={{ flex: 1 }}
              value={selectedQoI || ""}
              onChange={e => {
                setSelectedQoI(e.target.value);
              }}
              mmux-testid="qoi-select"
            >
              {outputVars.map(qoi => (
                <MenuItem key={`qoi-${qoi}`} value={qoi}>
                  {qoi}
                </MenuItem>
              ))}
            </Select>
          </InputLabel>
        )
      }
    />
  );
}

export default SuMoPlotsSteps;
