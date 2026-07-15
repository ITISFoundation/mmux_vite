import React from "react";
import { Button } from "@mui/material";
import { QueryStats } from "@mui/icons-material";
import SteppedPlotCard, { type SteppedStep } from "./SteppedPlotCard";
import UncertainUQ from "./UncertainUQ";
import CorrelationIndicesPlot from "./CorrelationIndicesPlot";
import SobolIndicesPlot from "./SobolIndicesPlot";

const uqStepTitles = ["Histogram", "Correlation", "Sobol' Indices"];

const uqStepInfoTexts: Record<string, string | undefined> = {
  Histogram: "Uncertainty propagation histogram with percentile statistics",
  Correlation: undefined,
  "Sobol' Indices": undefined,
};

type UQPlotsStepsProps = LoadingPropsType & {
  onStatsClick?: () => void;
};

function UQPlotsSteps(props: UQPlotsStepsProps) {
  const { loading, jobProgress, colsFetched, jobsFetched, onStatsClick } = props;
  const [activeStep, setActiveStep] = React.useState(0);
  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const steps: SteppedStep[] = [
    {
      title: uqStepTitles[0],
      infoText: uqStepInfoTexts[uqStepTitles[0]],
      content: <UncertainUQ colsFetched={colsFetched} jobProgress={jobProgress} jobsFetched={jobsFetched} loading={loading} />,
    },
    { title: uqStepTitles[1], infoText: uqStepInfoTexts[uqStepTitles[1]], content: <CorrelationIndicesPlot /> },
    { title: uqStepTitles[2], infoText: uqStepInfoTexts[uqStepTitles[2]], content: <SobolIndicesPlot /> },
  ];

  return (
    <SteppedPlotCard
      steps={steps}
      activeStep={activeStep}
      maxSteps={uqStepTitles.length}
      onNext={handleNext}
      onBack={handleBack}
      contentMinHeight={500}
      nextTestId="uq-plot-next"
      backTestId="uq-plot-back"
      qoiSelector={
        activeStep === 0 &&
        onStatsClick && (
          <Button
            variant="text"
            size="small"
            onClick={onStatsClick}
            startIcon={<QueryStats />}
            sx={{ textTransform: "none" }}
            mmux-testid="uq-stats-button"
          >
            Stats
          </Button>
        )
      }
    />
  );
}

export default UQPlotsSteps;
