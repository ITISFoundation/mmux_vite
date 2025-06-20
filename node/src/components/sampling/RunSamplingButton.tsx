import { Button, CircularProgress } from '@mui/material';
import { useMMUXContext } from '../../context/MMUXContext';
import { useServiceContext } from '../../context/ServiceContext';
import { toast } from 'react-toastify';
import CustomTooltip from '../CustomTooltip';

type RunSamplingButtonProps = {
  handleRunSampling: () => void;
  disabled?: boolean;
};

export const RunSamplingButton = (props: RunSamplingButtonProps) => {
  const { permissions } = useServiceContext()
  console.info("Current permissions: ", permissions)
  const { handleRunSampling, disabled } = props;
  const { launchingSampling, setLaunchingSampling, setRunningSampling } = useMMUXContext();
  const serviceAddress = window.location.href


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
      <CustomTooltip
        title={
          launchingSampling
            ? "Sampling is being launched... Please wait until the current sampling operation is fully launched before launching a new campaign / job"
            : disabled
              ? "Sampling is disabled"
              : permissions !== "WRITE"
                ? `This is a preview version that runs on a precomputed demonstration application. If you want to explore it using your own Projects, please contact support@${serviceAddress}`
                : ""
        }
        placement="top"
        disableHoverListener={!launchingSampling && !disabled && permissions === "WRITE"}
      >
        <span>
          <Button
            variant="contained"
            onClick={handleRunSamplingWithErrorHandling}
            disabled={launchingSampling || disabled || (permissions !== "WRITE")}
            sx={(theme) => ({
              "&:disabled": {
                backgroundColor: launchingSampling ? theme.palette.grey[100] : undefined,
                color: launchingSampling ? theme.palette.primary.contrastText : undefined,
              }
            })}
          >
            {launchingSampling ? (
              <>
                Launching...<CircularProgress size={"1.1rem"} thickness={6} sx={{ marginLeft: '1rem' }} />
              </>
            ) : "Run Sampling"}
          </Button>
        </span>
      </CustomTooltip>
    </>
  );
}
