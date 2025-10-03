import React from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  InputLabel,
  MenuItem,
  MobileStepper,
  Select,
  useTheme,
} from "@mui/material";
import { InfoOutline, KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import IsoSurface3DPlot from "./IsoSurface3DPlot";
import Curves1DPlots from "./Curves1DPlot";
import SuMoValidation from "./SuMoValidation";
import Surface2DPlot from "./Surface2DPlot";
import Header from "../navigation/Header";
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
  const { ServiceMode } = useServiceContext();
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

  const stepTitles = ["Validation", "1D Curves", "2D Surface", "3D IsoSurface"];
  const stepInfoTexts: { [key: string]: string | undefined } = {
    Validation: "Assessment of model quality through Cross-Validation ",
    "1D Curves": undefined,
    "2D Surface": undefined,
    "3D IsoSurface": undefined,
  };
  const stepExtendedInfoTexts: {
    [key: string]: React.ReactElement | undefined;
  } = {
    Validation: CrossValidationDocument,
    "1D Curves": undefined,
    "2D Surface": undefined,
    "3D IsoSurface": undefined,
  };

  React.useEffect(() => {
    const jobs = filteredJobList;
    if (jobs.length === 0) {
      // avoid everything disappearing when there are not enough selected jobs
      setFilteredInputVars(inputVars);
    } else {
      setFilteredInputVars(filterInputVars({ ...context, selectedFunction, inputVars, distribution }));
    }
    setMaxSteps(Math.min(filteredInputVars.length + 1, stepTitles.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobUids, filteredJobList]);

  return (
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
        <Header
          headerType="titleNoMargin"
          tabTitle={stepTitles[activeStep]}
          infoText={stepInfoTexts[stepTitles[activeStep]]}
          ExtendedInfoText={stepExtendedInfoTexts[stepTitles[activeStep]]}
          QOISelector={
            ServiceMode === "MOGA" && (
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
                    ExtendedTooltip={SelectQoIDocument}
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
                  value={selectedQoI}
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
      </Box>
      <CardContent
        sx={{
          padding: 0,
          margin: "16px 0px",
          borderRadius: theme.spacing(2),
          overflow: "hidden",
        }}
      >
        {activeStep === 0 && filteredInputVars.length > 0 ? <SuMoValidation /> : undefined}
        {activeStep === 1 && filteredInputVars.length > 0 ? <Curves1DPlots /> : undefined}
        {activeStep === 2 && filteredInputVars.length > 1 ? <Surface2DPlot /> : undefined}
        {activeStep === 3 && filteredInputVars.length > 2 ? <IsoSurface3DPlot /> : undefined}
      </CardContent>
      <CardActions sx={{ padding: 0 }}>
        <MobileStepper
          variant="dots"
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{
            maxWidth: 400,
            flexGrow: 1,
            margin: "0px auto",
            borderRadius: 2,
            backgroundColor: theme.palette.background.default,
          }}
          nextButton={
            <Button
              size="small"
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === maxSteps - 1}
              sx={{ alignItems: "end" }}
            >
              Next
              {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </Button>
          }
          backButton={
            <Button size="small" variant="contained" onClick={handleBack} disabled={activeStep === 0} sx={{ alignItems: "end" }}>
              {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
              Back
            </Button>
          }
        />
      </CardActions>
    </Card>
  );
}

export default SuMoPlotsSteps;
