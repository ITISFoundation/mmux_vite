import React from "react";
import SteppedPlotCard, { type SteppedStep } from "./SteppedPlotCard";
import UncertainUQ from "./UncertainUQ";
import CorrelationIndicesPlot, { type CorrelationViewMode } from "./CorrelationIndicesPlot";
import SobolIndicesPlot, { type SobolViewMode } from "./SobolIndicesPlot";
import { type CorrelationScaleType, type ScaleType } from "../../utils/plotScale";

const uqStepTitles = ["Histogram", "Correlation", "Sobol' Indices"];

const uqStepInfoTexts: Record<string, string | undefined> = {
  Histogram: "Uncertainty propagation histogram with percentile statistics",
  Correlation: undefined,
  "Sobol' Indices": undefined,
};

type UQPlotsStepsProps = LoadingPropsType & { qoiSelector?: React.ReactNode; onOpenSettings?: () => void };

function UQPlotsSteps(props: UQPlotsStepsProps) {
  const { loading, jobProgress, colsFetched, jobsFetched, qoiSelector, onOpenSettings } = props;
  const [activeStep, setActiveStep] = React.useState(0);
  const [sobolViewMode, setSobolViewMode] = React.useState<SobolViewMode>("first-order");
  const [sobolScaleType, setSobolScaleType] = React.useState<ScaleType>("log");
  const [correlationViewMode, setCorrelationViewMode] = React.useState<CorrelationViewMode>("pearson");
  const [correlationScaleType, setCorrelationScaleType] = React.useState<CorrelationScaleType>("abslog");
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
      content: (
        <UncertainUQ
          colsFetched={colsFetched}
          jobProgress={jobProgress}
          jobsFetched={jobsFetched}
          loading={loading}
          onOpenSettings={onOpenSettings}
        />
      ),
    },
    {
      title: uqStepTitles[1],
      infoText: uqStepInfoTexts[uqStepTitles[1]],
      content: (
        <CorrelationIndicesPlot
          viewMode={correlationViewMode}
          scaleType={correlationScaleType}
          onViewModeChange={(_event, newMode) => {
            if (newMode !== null) setCorrelationViewMode(newMode);
          }}
          onScaleTypeChange={(_event, newScale) => {
            if (newScale !== null) setCorrelationScaleType(newScale);
          }}
        />
      ),
    },
    {
      title: uqStepTitles[2],
      infoText: uqStepInfoTexts[uqStepTitles[2]],
      content: (
        <SobolIndicesPlot
          viewMode={sobolViewMode}
          scaleType={sobolScaleType}
          onViewModeChange={(_event, newMode) => {
            if (newMode !== null) setSobolViewMode(newMode);
          }}
          onScaleTypeChange={(_event, newScale) => {
            if (newScale !== null) setSobolScaleType(newScale);
          }}
        />
      ),
    },
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
      qoiSelector={qoiSelector}
    />
  );
}

export default UQPlotsSteps;
