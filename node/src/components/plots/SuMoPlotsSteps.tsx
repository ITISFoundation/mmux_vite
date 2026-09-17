import React from "react";
import IsoSurface3DPlot from "./IsoSurface3DPlot";
import Curves1DPlots from "./Curves1DPlot";
import SuMoValidation from "./SuMoValidation";
import Surface2DPlot from "./Surface2DPlot";
import SteppedPlotCard, { type SteppedStep } from "./SteppedPlotCard";
import { filterInputVars } from "./PlotTools";
import CrossValidationDocument from "../documents/CrossValidationDocument";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";

function SuMoPlotsSteps() {
  const { inputVars, selectedFunction, distribution } = useFunctionContext();
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
    const nextFilteredInputVars =
      jobs.length === 0 ? inputVars : filterInputVars({ ...context, selectedFunction, inputVars, distribution });
    const nextMaxSteps = Math.min(nextFilteredInputVars.length + 1, stepDefinitions.length);
    setFilteredInputVars(nextFilteredInputVars);
    setMaxSteps(nextMaxSteps);
    setActiveStep(prevActiveStep => Math.min(prevActiveStep, Math.max(0, nextMaxSteps - 1)));
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
    />
  );
}

export default SuMoPlotsSteps;
