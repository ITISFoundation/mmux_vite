import { Alert, Container, Box } from "@mui/material";
import { useServiceContext } from "../../context/ServiceContext";
import { getSimplifiedHost } from "../../utils/function_utils";

const PreviewWarning = () => {
  const simplifiedHost = getSimplifiedHost();
  const { serviceMode, permissions } = useServiceContext();
  return permissions === "READ-ONLY" ? (
    <Container>
      <Box paddingTop={2}>
        <Alert variant="outlined" severity="info">
          This is a preview of the
          {serviceMode === "UQ" && " Uncertainty Quantification "}
          {serviceMode === "SUMO" && " Response Surface Modeling "}
          {serviceMode === "MOGA" && " Multi Objective Genetic Algorithm "}
          HyperTool that runs on a precomputed demonstration application. If you
          want to explore it using your own Projects, please contact support@
          {simplifiedHost}
        </Alert>
      </Box>
    </Container>
  ) : (
    ""
  );
};

export default PreviewWarning;
