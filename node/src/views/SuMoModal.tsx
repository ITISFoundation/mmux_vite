import { Modal } from "@mui/material";
import SuMoPlotsSteps from "./../components/plots/SuMoPlotsSteps";

const SuMoModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {

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
      children={
        <SuMoPlotsSteps />
      }
    />
  );
};

export default SuMoModal;
