import React from "react";
import { Box, Modal } from "@mui/material";
import SuMoPlotsSteps from "../components/plots/SuMoPlotsSteps";

function SuMoModal({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      {/* MUI Modal injects a ref into its single child for focus management, so the
          child must be able to hold a ref. Box (a ref-forwarding component) wraps the
          plain SuMoPlotsSteps function component and centers it. */}
      <Box
        mmux-testid="sumo-model-modal"
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
        <SuMoPlotsSteps />
      </Box>
    </Modal>
  );
}

export default SuMoModal;
