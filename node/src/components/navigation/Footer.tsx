import { Button, Paper } from "@mui/material";
import { stepValidator } from "../../utils/stepValidator";
import { useNavigationContext } from "../../context/NavigationContext";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useServiceContext } from "../../context/ServiceContext";

type FooterProps = {
  steps: Step[];
};

export function Footer(props: FooterProps) {
  const { steps } = props;
  const functionContext = useFunctionContext();
  const jobContext = useJobContext();
  const { serviceMode } = useServiceContext();
  const { currentView, setCurrentView } = useNavigationContext();

  return (
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
        mmux-testid="previous-button"
        onClick={() => setCurrentView(currentView <= 0 ? 0 : currentView - 1)}
        disabled={currentView <= 0}
      >
        Previous
      </Button>
      <Button
        className="footerBtn footerBtnLast"
        variant="contained"
        mmux-testid="next-button"
        onClick={() => setCurrentView(currentView >= steps.length - 1 ? steps.length - 1 : currentView + 1)}
        disabled={currentView >= steps.length - 1 || !stepValidator(functionContext, jobContext, serviceMode, currentView)}
      >
        Next
      </Button>
    </Paper>
  );
}
