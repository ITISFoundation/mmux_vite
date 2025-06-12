import { Box, Button } from '@mui/material';
import { useMMUXContext } from '../context/MMUXContext';
import { toast } from 'react-toastify';

type RunSamplingButtonProps = {
  handleRunSampling: () => void;
};

export const RunSamplingButton = (props: RunSamplingButtonProps) => {
  const { handleRunSampling } = props;
  const { launchingSampling, runningSampling, setLaunchingSampling, setRunningSampling } = useMMUXContext();

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
    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginTop: '16px' }}>
      {/* <Button variant="contained" onClick={() => }>Run LHS Sampling</Button> */}

      <Button
        variant="contained"
        onClick={handleRunSamplingWithErrorHandling}
        disabled={launchingSampling || runningSampling}
      >
        {launchingSampling
          ? "Launching..."
          : runningSampling
            ? "Running..."
            : "Run Sampling"}
      </Button>
      {launchingSampling && <Box className="spinner" />}
    </Box>
  );
}
