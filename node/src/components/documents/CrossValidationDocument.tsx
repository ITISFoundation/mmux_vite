import { Card, CardContent, Typography } from "@mui/material";
import Header from "../navigation/Header";

const CrossValidationDocument = (
    <Card sx={{ padding: "8px", borderRadius: "16px", maxWidth: "800px" }}>
        <CardContent
            sx={{ display: "flex", flexDirection: "column", alignItems: "left" }}
        >
            <Header
                headerType="subTitle"
                tabTitle="Cross-Validation"
                infoText=""
            />
            <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
                To assess the quality of the surrogate model, the underlying data is split into five similarly sized groups.
            </Typography>
            <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
                Subsequently, for the ground truth values (‘Observations’) from each group, are compared to predictions obtained by fitting a surrogate model to the other four groups.
            </Typography>
            <Typography variant="body1" fontFamily={"inherit"} flex={1} mb={1}>
                The agreement between ‘Observations’ and ‘Predictions’ is a measure for the surrogate model quality.
            </Typography>
        </CardContent>
    </Card>
);

export default CrossValidationDocument;
