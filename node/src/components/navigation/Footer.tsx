import React from "react";
import { Button, Modal, Paper } from "@mui/material";
import JobsDashboard from "../../views/ParallelRunner";
import { stepValidator } from "../../utils/stepValidator";
import { useNavigationContext } from "../../context/NavigationContext";
import { useFunctionContext } from "../../context/FunctionContext";
import { useSamplingContext } from "../../context/SamplingContext";
import { useJobContext } from "../../context/JobContext";
import { useServiceContext } from "../../context/ServiceContext";

type FooterProps = {
  steps: Step[];
};

export const Footer = (props: FooterProps) => {
  const { steps } = props;
  const { permissions } = useServiceContext();
  const functionContext = useFunctionContext();
  const jobContext = useJobContext();
  const { serviceMode } = useServiceContext();
  const { currentView, setCurrentView } = useNavigationContext();
  const { runningSampling } = useSamplingContext();
  const [modal, setModal] = React.useState(false);

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
        {permissions === "WRITE" && (
          <Button
            className="footerBtn"
            variant="contained"
            onClick={() => setModal(!modal)}
            disabled={!runningSampling}
          >
            TASK MANAGER
          </Button>
        )}
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
            !stepValidator(functionContext, jobContext, serviceMode, currentView)
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
        {runningSampling && runningSampling === true ? (
          <JobsDashboard progressBarOnly={false} />
        ) : (
          <></>
        )}
      </Modal>
    </>
  );
};
