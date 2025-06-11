import { Card, CardContent, Typography, Link } from "@mui/material";
import Header from "../Header";

const AdaptExtedSamplingDocument = (
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
        Modify the function samples used to construct the surrogate model (SuMo)
        and/or run additional sampling of the response surfaces to improve the
        SuMo quality.
      </Typography>
      <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
        Adding more sample points in under-sampled regions or adjusting the
        sampling strategy helps the surrogate model better capture the true
        response surface behavior.
      </Typography>
      <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
        This reduces both the interpolation uncertainty of the Gaussian Process
        and improves the overall reliability of your uncertainty propagation
        results. Better sampling leads to more accurate uncertainty
        quantification with tighter confidence bounds.
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

export default AdaptExtedSamplingDocument;
