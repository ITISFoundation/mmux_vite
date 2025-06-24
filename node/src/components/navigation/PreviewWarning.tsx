import { Alert, Container, Box } from "@mui/material";
import { useServiceContext } from "../../context/ServiceContext";
import { getDeploymentUrl } from "../../utils/function_utils";

const PreviewWarning = () => {
  const deploymentUrl = getDeploymentUrl();
  const { serviceMode, permissions } = useServiceContext();
  return permissions === "READ-ONLY" ? (
    <Container>
      <Box paddingTop={2}>
        <Alert variant="outlined" severity="info">
          This is a preview of the{" "}
          {serviceMode === "UQ"
            ? "Uncertainty Quantification"
            : "Meta-Modeling Insights"}{" "}
          Hypertool that runs on a precomputed demonstration application. If you
          want to explore it using your own Projects, please contact support@
          {deploymentUrl}
        </Alert>
      </Box>
    </Container>
  ) : (
    ""
  );
};

export default PreviewWarning;
