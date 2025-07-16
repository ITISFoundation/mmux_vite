import React from "react";
import { Button, Modal, Paper } from "@mui/material";
import { useMMUXContext } from "../../context/MMUXContext";
import JobsDashboard from "../../views/ParallelRunner";
import { stepValidator } from "../../utils/stepValidator";
import { useNavigationContext } from "../../context/NavigationContext";

type FooterProps = {
  steps: Step[];
};

export const Footer = (props: FooterProps) => {
  const { steps } = props;
  const { currentView, setCurrentView } = useNavigationContext();
  const context = useMMUXContext();
  const { runningSampling } = context;
  const [modal, setModal] = React.useState(false);
  const isJobsRunning = runningSampling;

  return (
    <>
      <Paper sx={{marginTop: '32px', display: 'flex', justifyContent: 'space-between'}} variant="outlined">
        <Button
          className="footerBtn footerBtnFirst"
          variant="contained"
          onClick={() =>
            setCurrentView(currentView <= 0 ? 0 : currentView - 1)
          }
          disabled={currentView <= 0}
        >
          Previous
        </Button>
        {/* <Box>
          <Button
            className="footerBtn"
            variant="contained"
            onClick={() => setModal(!modal)}
            disabled={!isJobsRunning}
          >
            TASK MANAGER
          </Button>
        </Box> */}
        <Button
          className="footerBtn footerBtnLast"
          variant="contained"
          onClick={() =>
            setCurrentView(currentView >= (steps.length -1) ? (steps.length -1) : currentView + 1)
          }
          disabled={currentView >= (steps.length -1) || !stepValidator(context, currentView)}
        >
          Next
        </Button>
      </Paper>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          margin: "auto",
          width: "80vw",
          height: "80vh",
        }}
      >
        {isJobsRunning && isJobsRunning === true ? (
          <JobsDashboard progressBarOnly={false} />
        ) : (
          <></>
        )}
      </Modal>
    </>
  );
};
