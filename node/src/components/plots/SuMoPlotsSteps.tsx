import React from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  MobileStepper,
  useTheme,
} from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import IsoSurface3DPlot from "./IsoSurface3DPlot";
import Curves1DPlots from "./Curves1DPlot";
import SuMoValidation from "./SuMoValidation";
import Surface2DPlot from "./Surface3DPlot";
import Header from "../navigation/Header";
import { filterInputVars } from "./PlotTools";
import { useMMUXContext } from "../../context/MMUXContext";

const SuMoPlotsSteps = () => {
  const theme = useTheme();
  const context = useMMUXContext();
  const { inputVars, filterSelectedJobList, selectedJobUids } = context;
  const [activeStep, setActiveStep] = React.useState(0);
  const [filteredInputVars, setFilteredInputVars] = React.useState(inputVars)
  const [maxSteps, setMaxSteps] = React.useState(0)
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const stepTitles = ["Validation", "1D Curves", "2D Surface", "3D IsoSurface"];

  React.useEffect(() => {
    const jobs = filterSelectedJobList;
    if (jobs.length === 0) {
      // avoid everything disappearing when there are not enough selected jobs
      setFilteredInputVars(inputVars)
    } else {
      setFilteredInputVars(filterInputVars(context));
    }
    setMaxSteps(Math.min(filteredInputVars.length + 1, stepTitles.length))
  }, [selectedJobUids, filterSelectedJobList]);

  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: "auto",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          padding: "16px 0px 0px 16px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Header
          headerType="titleNoMargin"
          tabTitle={stepTitles[activeStep]}
          infoText=""
        />
      </Box>
      <CardContent>
        {activeStep === 0 && filteredInputVars.length > 0 ? (
          <SuMoValidation />
        ) : undefined}
        {activeStep === 1 && filteredInputVars.length > 0 ? (
          <Curves1DPlots />
        ) : undefined}
        {activeStep === 2 && filteredInputVars.length > 1 ? (
          <Surface2DPlot />
        ) : undefined}
        {activeStep === 3 && filteredInputVars.length > 2 ? (
          <IsoSurface3DPlot />
        ) : undefined}
      </CardContent>
      <CardActions>
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
            backgroundColor: theme.palette.background.paper,
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
              {theme.direction === "rtl" ? (
                <KeyboardArrowLeft />
              ) : (
                <KeyboardArrowRight />
              )}
            </Button>
          }
          backButton={
            <Button
              size="small"
              variant="contained"
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ alignItems: "end" }}
            >
              {theme.direction === "rtl" ? (
                <KeyboardArrowRight />
              ) : (
                <KeyboardArrowLeft />
              )}
              Back
            </Button>
          }
        />
      </CardActions>
    </Card>
  );
};

export default SuMoPlotsSteps;
