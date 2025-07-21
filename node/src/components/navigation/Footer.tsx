import React from "react";
import { Button, Modal, Paper } from "@mui/material";
import JobsDashboard from "../../views/ParallelRunner";
import { stepValidator } from "../../utils/stepValidator";
import { useNavigationContext } from "../../context/NavigationContext";
import { useFunctionContext } from "../../context/FunctionContext";
import { useSamplingContext } from "../../context/SamplingContext";
import { useJobContext } from "../../context/JobContext";

type FooterProps = {
  steps: Step[];
};

export const Footer = (props: FooterProps) => {
  const { steps } = props;
  const functionContext = useFunctionContext();
  const { currentView, setCurrentView } = useNavigationContext();
  const { runningSampling } = useSamplingContext();
  const context = useJobContext();
  const [modal, setModal] = React.useState(false);
  const isJobsRunning = runningSampling;

  return (
    <>
      <Paper
        sx={{
          marginTop: "32px",
          display: "flex",
          justifyContent: "space-between",
        }}
        variant="outlined"
      >
        <Button
          className="footerBtn footerBtnFirst"
          variant="contained"
          onClick={() => setCurrentView(currentView <= 0 ? 0 : currentView - 1)}
          disabled={currentView <= 0}
        >
          Previous
        </Button>
        <Button
          className="footerBtn"
          variant="contained"
          onClick={() => setModal(!modal)}
          disabled={!isJobsRunning}
        >
          TASK MANAGER
        </Button>
        <Button
          className="footerBtn footerBtnLast"
          variant="contained"
          onClick={() =>
            setCurrentView(
              currentView >= steps.length - 1
                ? steps.length - 1
                : currentView + 1
            )
          }
          disabled={
            currentView >= steps.length - 1 ||
            !stepValidator(functionContext, context, currentView)
          }
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
