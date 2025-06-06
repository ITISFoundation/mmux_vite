import { Box, Button } from '@mui/material';
import { useMMUXContext } from '../context/MMUXContext';

type RunSamplingButtonProps = {
  handleRunSampling: () => void;
};

export const RunSamplingButton = (props: RunSamplingButtonProps) => {
    const { handleRunSampling } = props;
    const context = useMMUXContext();
    const { launchingSampling, runningSampling } = context;

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginTop: '16px' }}>
        {/* <Button variant="contained" onClick={() => }>Run LHS Sampling</Button> */}

        <Button
          variant="contained"
          onClick={handleRunSampling}
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
