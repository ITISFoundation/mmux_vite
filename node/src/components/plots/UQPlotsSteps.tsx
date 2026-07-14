import React from "react";
import SteppedPlotCard, { type SteppedStep } from "./SteppedPlotCard";
import UncertainUQ from "./UncertainUQ";
import CorrelationIndicesPlot from "./CorrelationIndicesPlot";
import SobolIndicesPlot from "./SobolIndicesPlot";

const uqStepTitles = ["Histogram", "Correlation", "Sobol'"];

const uqStepInfoTexts: Record<string, string | undefined> = {
  Histogram: "Uncertainty propagation histogram with percentile statistics",
  Correlation: undefined,
  "Sobol'": undefined,
};

type UQPlotsStepsProps = LoadingPropsType;

function UQPlotsSteps(props: UQPlotsStepsProps) {
  const { loading, jobProgress, colsFetched, jobsFetched } = props;
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
      nextTestId="uq-plot-next"
      backTestId="uq-plot-back"
    />
  );
}

export default UQPlotsSteps;
