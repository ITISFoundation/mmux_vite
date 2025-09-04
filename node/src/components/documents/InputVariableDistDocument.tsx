import { Card, CardContent, Typography } from "@mui/material";
import Header from "../navigation/Header";
import { getManualLink } from "../navigation/TutorialManualLinks";

const InputVariableDistDocument = (
  <Card sx={{ padding: "8px", borderRadius: "16px", maxWidth: "800px" }}>
    <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "left" }}>
      <Header headerType="subTitle" tabTitle="Input Variable Distribution" infoText="" />
      <Typography variant="body1" fontFamily="inherit" flex={1} mb={1}>
        Specify the probability distribution for every input parameter in your selected function.
      </Typography>
      <Typography variant="body1" fontFamily="inherit" flex={1} mb={1}>
        Each parameter's uncertainty is characterized by a statistical distribution (such as Normal, Log-Normal or Constant) that
        describes the range and likelihood of possible values.
      </Typography>
      <Typography variant="body1" fontFamily="inherit" flex={1} mb={1}>
        Input parameters are assumed to be stochastically independent, meaning the value of one parameter doesn't influence the
        probability distribution of another.
      </Typography>
      <Typography variant="body1" fontFamily="inherit" flex={1} mb={1}>
        This assumption simplifies the mathematical treatment but should be verified against your physical understanding of the
        system. The distributions you define here determine how uncertainty propagates through your simulation.
      </Typography>
      <Typography variant="body1" fontFamily="inherit" sx={{ marginTop: "16px" }}>
        For additional information on how add variable distributions, please refer to the {getManualLink()}.
      </Typography>
    </CardContent>
  </Card>
);

export default InputVariableDistDocument;
