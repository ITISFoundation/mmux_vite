import { Button, CircularProgress } from '@mui/material';
import { useMMUXContext } from '../context/MMUXContext';
import { useServiceContext } from '../context/ServiceContext';
import { toast } from 'react-toastify';

type RunSamplingButtonProps = {
  handleRunSampling: () => void;
  disabled?: boolean;
};

export const RunSamplingButton = (props: RunSamplingButtonProps) => {
  const { permissions } = useServiceContext()
  console.info("Current permissions: ", permissions)
  const { handleRunSampling, disabled } = props;
  const { launchingSampling, setLaunchingSampling, setRunningSampling } = useMMUXContext();

  const handleRunSamplingWithErrorHandling = async () => {
    try {
      await handleRunSampling();
      setLaunchingSampling(false);
      setRunningSampling(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to run sampling. Please check the console for details.");
      setLaunchingSampling(false);
      setRunningSampling(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleRunSamplingWithErrorHandling}
        disabled={launchingSampling || disabled || (permissions === "WRITE")}
      >
        {launchingSampling ? (
          <>
            Launching... <CircularProgress size={"0.875rem"} />
          </>
        ) : "Run Sampling"}
      </Button>
    </>
  );
}
