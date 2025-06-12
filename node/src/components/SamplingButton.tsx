import { Button, CircularProgress } from "@mui/material";
import { useMMUXContext } from "../context/MMUXContext";

type RunSamplingButtonProps = {
  handleRunSampling: () => void;
  disabled?: boolean;
};

export const RunSamplingButton = (props: RunSamplingButtonProps) => {
  const { handleRunSampling, disabled } = props;
  const { launchingSampling, runningSampling } = useMMUXContext();

  return (
    <>
      <Button
        variant="contained"
        onClick={handleRunSampling}
        disabled={launchingSampling || runningSampling || disabled}
      >
        {launchingSampling ? (
          <>
            Launching... <CircularProgress size={"0.875rem"} />
          </>
        ) : runningSampling ? (
          "Running..."
        ) : (
          "Run Sampling"
        )}
      </Button>
    </>
  );
};
