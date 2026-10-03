import { useEffect } from "react";
import { Box, Modal } from "@mui/material";
import Header from "../components/navigation/Header";
import { QoISelector } from "../components/plots/QoISelector";
import SuMoValidation from "../components/plots/SuMoValidation";
import { useFunctionContext } from "../context/FunctionContext";
import { useMMUXContext } from "../context/MMUXContext";

function ValidationModal({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const { outputVars } = useFunctionContext();
  const { selectedQoI, validationQoI, setValidationQoI } = useMMUXContext();

  useEffect(() => {
    if (open && validationQoI === undefined) {
      setValidationQoI(selectedQoI ?? outputVars[0]);
    }
  }, [open, outputVars, selectedQoI, validationQoI, setValidationQoI]);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="validation-modal-title"
      aria-describedby="validation-modal-description"
    >
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
        <Header
          headerType="titleNoMargin"
          tabTitle="Validation"
          qoiSelector={
            <QoISelector
              outputVars={outputVars}
              selectedQoI={validationQoI}
              setSelectedQoI={setValidationQoI}
              testId="validation-qoi-select"
            />
          }
        />
        <SuMoValidation validationQoIOverride={validationQoI} />
      </Box>
    </Modal>
  );
}

export default ValidationModal;
