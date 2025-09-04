import React from "react";
import { Modal } from "@mui/material";
import SuMoPlotsSteps from "../components/plots/SuMoPlotsSteps";

function SuMoModal({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        margin: "auto",
        width: "80%",
        maxWidth: "1080px",
        height: "80%",
      }}
    >
      <SuMoPlotsSteps />
    </Modal>
  );
}

export default SuMoModal;
