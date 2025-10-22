import { Button, CircularProgress, useTheme } from "@mui/material";
import { toast } from "react-toastify";
import { useServiceContext } from "../../context/ServiceContext";
import CustomTooltip from "../utils/CustomTooltip";
import { getSimplifiedHost } from "../../utils/function_utils";
import { useSamplingContext } from "../../context/SamplingContext";

type RunSamplingButtonProps = {
  handleRunSampling: () => Promise<void>;
  disabled?: boolean;
};

const tooltipMessage = {
  launching:
    "Sampling is being launched... Please wait until the current sampling operation is fully launched before launching a new campaign / job",
  disabled: "Sampling is disabled",
  preview: `This is a preview version that runs on a precomputed demonstration application. If you want to explore it using your own Projects, please contact support@`,
};

export function RunSamplingButton(props: RunSamplingButtonProps) {
  const { handleRunSampling, disabled } = props;
  const theme = useTheme();
  const { permissions } = useServiceContext();
  const { launchingSampling, setLaunchingSampling, setRunningSampling } = useSamplingContext();
  const simplifiedHost = getSimplifiedHost();

  const handleRunSamplingWithErrorHandling = async () => {
    try {
      await handleRunSampling();
      setRunningSampling(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to run job(s). Please check the console for details.");
      setLaunchingSampling(false);
      setRunningSampling(false);
    }
  };

  let state = "";
  if (launchingSampling) state = tooltipMessage.launching;
  else if (disabled) state = tooltipMessage.disabled;
  else if (permissions !== "WRITE") state = tooltipMessage.preview.concat(simplifiedHost);

  return (
    <CustomTooltip
      title={state}
      placement="top"
      disableHoverListener={!launchingSampling && !disabled && permissions === "WRITE"}
    >
      <span>
        <Button
          variant="contained"
          onClick={handleRunSamplingWithErrorHandling}
          disabled={launchingSampling || disabled || permissions !== "WRITE"}
          mmux-testid="run-sampling-btn"
          sx={{
            "&:disabled": {
              backgroundColor: launchingSampling ? theme.palette.grey[100] : undefined,
              color: launchingSampling ? theme.palette.primary.contrastText : undefined,
            },
          }}
        >
          {launchingSampling ? (
            <>
              Launching...
              <CircularProgress size="1.1rem" thickness={6} sx={{ marginLeft: "1rem" }} />
            </>
          ) : (
            "Run"
          )}
        </Button>
      </span>
    </CustomTooltip>
  );
}
