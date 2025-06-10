import React from "react";
import { Button, Card, MobileStepper, Modal, useTheme } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { useMMUXContext } from "../context/MMUXContext";
import IsoSurface3DPlot from "./IsoSurface3DPlot";
import Curves1DPlots from "./PlotDataTogether";
import SuMoValidation from "./SuMoValidation";
import Surface2DPlot from "./Surface3DPlot";

const SuMoModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const theme = useTheme();
  const { inputVars } = useMMUXContext();
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        margin: "auto",
        width: "50%",
        height: "60%",
      }}
    >
      <Card
        sx={{
          padding: 2,
          borderRadius: 2,
          overflow: "auto",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {activeStep === 0 && inputVars.length > 0 ? (
          <SuMoValidation />
        ) : undefined}
        {activeStep === 1 && inputVars.length > 0 ? (
          <Curves1DPlots />
        ) : undefined}
        {activeStep === 2 && inputVars.length > 1 ? (
          <Surface2DPlot />
        ) : undefined}
        {activeStep === 3 && inputVars.length > 2 ? (
          <IsoSurface3DPlot />
        ) : undefined}
        <MobileStepper
          variant="dots"
          steps={4}
          position="static"
          activeStep={activeStep}
          sx={{
            maxWidth: 400,
            flexGrow: 1,
            margin: "16px auto 0px",
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }}
          nextButton={
            <Button
              size="small"
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === 3}
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
      </Card>
    </Modal>
  );
};

export default SuMoModal;
