import { Card, CardContent, Typography, Link } from "@mui/material";
import Header from "../Header";

const SelectQoIDocument = (
  <Card sx={{ padding: "8px", borderRadius: "16px", maxWidth: "800px" }}>
    <CardContent
      sx={{ display: "flex", flexDirection: "column", alignItems: "left" }}
    >
      <Header
        headerType="subTitle"
        tabTitle="Select Quantity of Interest"
        infoText=""
      />
      <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
        Once selected, your input parameter probability distributions are
        propagated through a Gaussian Process surrogate model (SuMo).
      </Typography>
      <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
        This surrogate model is fitted to the response surface of your chosen
        quantity of interest.
      </Typography>
      <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
        To ensure reliable results, multiple runs of stochastic sampling assess
        whether the propagated uncertainty distribution has converged. The final
        uncertainty quantification accounts for two sources of uncertainty: the
        variability between sampling runs and the interpolation uncertainty
        inherent in the Gaussian Process surrogate model itself.
      </Typography>
      <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
        This "uncertainty of uncertainty propagation" is visualized using
        whiskers in the results, giving you confidence bounds on your
        uncertainty estimates.
      </Typography>
      <Typography
        variant="body1"
        fontFamily={"inherit"}
        sx={{ marginTop: "16px" }}
      >
        For additional information on how add variable distributions, please
        refer to the{" "}
        <Link
          href="https://itis.swiss/osparc/docs/osparc-user-guide/#Distributions"
          color="info"
          target="_blank"
          rel="noopener noreferrer"
        >
          User Guide
        </Link>
        .
      </Typography>
    </CardContent>
  </Card>
);

export default SelectQoIDocument;
