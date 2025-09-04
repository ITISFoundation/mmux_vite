import { Card, CardContent, Typography } from "@mui/material";
import Header from "../navigation/Header";
import { getManualLink } from "../navigation/TutorialManualLinks";

const SelectFunctionDocument = (
  <Card sx={{ padding: "8px", borderRadius: "16px", maxWidth: "800px" }}>
    <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "left" }}>
      <Header headerType="subTitle" tabTitle="Function Creation" infoText="" />
      <Typography variant="body1" fontFamily="inherit" flex={1}>
        Functions are created from parameterized pipelines using the 'Create Function' tab when clicking on a Project on the
        Dashboard
      </Typography>
      <img
        src="https://itis.swiss/assets/images/News-and-Events/2024/20240314_oSPARC_Sim4Life_square__FocusFillMaxWyIwLjAwIiwiMC4wMCIsNTEyLDUxMl0.png"
        alt="Function Creation"
        style={{ width: "100%", margin: "16px 0px" }}
      />
      <Typography variant="body1" fontFamily="inherit" flex={1}>
        These functions encapsulate your entire simulation workflow with adjustable parameters, allowing you to systematically
        explore how parameter variations affect your simulation results. The function serves as the foundation for uncertainty
        quantification by defining which parameters can be varied and how your simulation responds to those variations.
      </Typography>
      <Typography variant="body1" fontFamily="inherit" sx={{ marginTop: "16px" }}>
        For additional information on how to create functions, please refer to the {getManualLink()}.
      </Typography>
    </CardContent>
  </Card>
);

export default SelectFunctionDocument;
