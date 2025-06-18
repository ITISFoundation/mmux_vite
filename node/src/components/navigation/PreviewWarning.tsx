import { Alert, Container, Box } from "@mui/material";
import { useServiceContext } from "../../context/ServiceContext";

const PreviewWarning = () => {
  const serviceAddress = window.location.href;
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
          {serviceAddress}
        </Alert>
      </Box>
    </Container>
  ) : (
    ""
  );
};

export default PreviewWarning;
