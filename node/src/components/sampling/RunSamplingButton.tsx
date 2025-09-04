import { Button, CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { useServiceContext } from "../../context/ServiceContext";
import CustomTooltip from "../utils/CustomTooltip";
import { getSimplifiedHost } from "../../utils/function_utils";
import { useSamplingContext } from "../../context/SamplingContext";

type RunSamplingButtonProps = {
  handleRunSampling: () => Promise<void>;
  disabled?: boolean;
};

export function RunSamplingButton(props: RunSamplingButtonProps) {
  const { permissions } = useServiceContext();
  const { handleRunSampling, disabled } = props;
  const { launchingSampling, setLaunchingSampling, setRunningSampling } = useSamplingContext();
  const simplifiedHost = getSimplifiedHost();

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
    <CustomTooltip
      title={
        launchingSampling
          ? "Sampling is being launched... Please wait until the current sampling operation is fully launched before launching a new campaign / job"
          : disabled
            ? "Sampling is disabled"
            : permissions !== "WRITE"
              ? `This is a preview version that runs on a precomputed demonstration application. If you want to explore it using your own Projects, please contact support@${simplifiedHost}`
              : ""
      }
      placement="top"
      disableHoverListener={!launchingSampling && !disabled && permissions === "WRITE"}
    >
      <span>
        <Button
          variant="contained"
          onClick={handleRunSamplingWithErrorHandling}
          disabled={launchingSampling || disabled || permissions !== "WRITE"}
          sx={theme => ({
            "&:disabled": {
              backgroundColor: launchingSampling ? theme.palette.grey[100] : undefined,
              color: launchingSampling ? theme.palette.primary.contrastText : undefined,
            },
          })}
        >
          {launchingSampling ? (
            <>
              Launching...
              <CircularProgress size="1.1rem" thickness={6} sx={{ marginLeft: "1rem" }} />
            </>
          ) : (
            "Run Sampling"
          )}
        </Button>
      </span>
    </CustomTooltip>
  );
}
