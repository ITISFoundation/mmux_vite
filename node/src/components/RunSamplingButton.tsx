import { Button, CircularProgress } from '@mui/material';
import { useMMUXContext } from '../context/MMUXContext';
import { toast } from 'react-toastify';

type RunSamplingButtonProps = {
  handleRunSampling: () => void;
  disabled?: boolean;
};

export const RunSamplingButton = (props: RunSamplingButtonProps) => {
  const { handleRunSampling, disabled } = props;
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
    <>
      <Button
        variant="contained"
        onClick={handleRunSamplingWithErrorHandling}
        disabled={launchingSampling || runningSampling || disabled}
        sx={(theme)=> ({
          "&:disabled": {
            backgroundColor: launchingSampling ?  theme.palette.grey[100] : '',
            color: launchingSampling ? theme.palette.primary.contrastText : '',
          }
        })}
      >
        {launchingSampling ? (
          <>
            Launching...<CircularProgress size={"1.1rem"} thickness={6} sx={{ marginLeft: '1rem'}} />
          </>
        ) : runningSampling
            ? "Running..."
            : "Run Sampling"}
      </Button>
    </>
  );
}
