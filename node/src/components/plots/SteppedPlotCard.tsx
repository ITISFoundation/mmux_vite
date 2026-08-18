import React from "react";
import { Box, Button, Card, CardActions, CardContent, MobileStepper, useTheme } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import Header from "../navigation/Header";

export type SteppedStep = {
  title: string;
  infoText?: string;
  extendedInfoText?: React.ReactElement;
  headerContent?: React.ReactNode;
  content: React.ReactNode;
};

export type SteppedPlotCardProps = {
  steps: SteppedStep[];
  activeStep: number;
  maxSteps: number;
  onNext: () => void;
  onBack: () => void;
  headerType?: HeaderTypes;
  qoiSelector?: React.ReactNode;
  nextTestId?: string;
  backTestId?: string;
  /** Reserves space for the content slot so steps of varying height don't shift the Next/Back buttons. */
  contentMinHeight?: number | string;
};

function SteppedPlotCard(props: SteppedPlotCardProps) {
  const { steps, activeStep, maxSteps, onNext, onBack, headerType, qoiSelector, nextTestId, backTestId, contentMinHeight } =
    props;
  const theme = useTheme();
  const currentStep = steps[activeStep];

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
          headerType={headerType || "titleNoMargin"}
          tabTitle={currentStep?.title}
          infoText={currentStep?.infoText}
          extendedInfoText={currentStep?.extendedInfoText}
          qoiSelector={
            <>
              {qoiSelector}
              {currentStep?.headerContent}
            </>
          }
        />
      </Box>
      <CardContent
        sx={{
          padding: 0,
          margin: "16px 0px",
          borderRadius: theme.spacing(2),
          overflow: "hidden",
          minHeight: contentMinHeight,
        }}
      >
        {currentStep?.content}
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
              onClick={onNext}
              disabled={activeStep === maxSteps - 1}
              sx={{ alignItems: "end" }}
              mmux-testid={nextTestId || "stepped-plot-next"}
            >
              Next
              {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </Button>
          }
          backButton={
            <Button
              size="small"
              variant="contained"
              onClick={onBack}
              disabled={activeStep === 0}
              sx={{ alignItems: "end" }}
              mmux-testid={backTestId || "stepped-plot-back"}
            >
              {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
              Back
            </Button>
          }
        />
      </CardActions>
    </Card>
  );
}

export default SteppedPlotCard;
