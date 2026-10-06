import { useEffect, useState } from "react";
import { Box, Modal } from "@mui/material";
import { QoISelector } from "../components/plots/QoISelector";
import SteppedPlotCard, { type SteppedStep } from "../components/plots/SteppedPlotCard";
import SuMoValidation from "../components/plots/SuMoValidation";
import { useFunctionContext } from "../context/FunctionContext";
import { useMMUXContext } from "../context/MMUXContext";

function ValidationModal({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const { outputVars } = useFunctionContext();
  const { selectedQoI, validationQoI, setValidationQoI } = useMMUXContext();
  const [activeStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    // A persisted QoI from a DIFFERENT function is defined but absent from
    // this function's outputs: the selector would render blank and CV would
    // post an invalid output name. Re-resolve whenever the current value is
    // not available for the selected function.
    const stale = validationQoI === undefined || !outputVars.includes(validationQoI);
    if (!stale) return;
    const next = selectedQoI && outputVars.includes(selectedQoI) ? selectedQoI : outputVars[0];
    if (next !== undefined) {
      setValidationQoI(next);
    }
  }, [open, outputVars, selectedQoI, validationQoI, setValidationQoI]);

  // One step today; further validation views plug in here and inherit the
  // card chrome (box + Back/Next + dots) for free. V47hd keeps the header
  // order controls → QoI selector, and the modal itself carries no action
  // buttons, so the selector sits rightmost inside this header.
  const steps: SteppedStep[] = [
    {
      title: "Validation",
      infoText: "Assessment of model quality through Cross-Validation",
      content: <SuMoValidation validationQoIOverride={validationQoI} />,
    },
  ];

  return (
    <Modal open={open} onClose={() => setOpen(false)} aria-label="Model validation">
      <Box
        mmux-testid="validation-modal"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          maxWidth: "1080px",
          maxHeight: "80%",
          overflow: "auto",
        }}
      >
        <SteppedPlotCard
          steps={steps}
          activeStep={activeStep}
          maxSteps={steps.length}
          onNext={() => undefined}
          onBack={() => undefined}
          qoiSelector={
            <QoISelector
              outputVars={outputVars}
              selectedQoI={validationQoI}
              setSelectedQoI={setValidationQoI}
              testId="validation-qoi-select"
            />
          }
          nextTestId="validation-plot-next"
          backTestId="validation-plot-back"
          contentMinHeight={500}
        />
      </Box>
    </Modal>
  );
}

export default ValidationModal;
