import {
  Container,
  Card,
  Typography,
  CircularProgress,
  CardHeader,
  useTheme,
} from "@mui/material";

export const SplashScreen = () => {
  const theme = useTheme();

  return (
    <Container
      style={{
        height: "100vh",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
      }}
    >
      <Card
        className="spinner"
        variant="outlined"
        style={{
          height: "240px",
          display: "block",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "16px",
          padding: "2rem",
          margin: "auto",
          backgroundColor: theme.palette.grey[200]
        }}
      >
        <Typography
          variant="h3"
          fontFamily={"inherit"}
          fontWeight={"100"}
          gutterBottom
        >
          MetaModelingUX
        </Typography>
        <CircularProgress size="3rem" sx={{ color: theme.palette.primary.main }} />
        <CardHeader
          title={
            <Typography
              variant="body1"
              fontFamily={"inherit"}
              fontWeight={"200"}
            >
              Starting up service
            </Typography>
          }
          style={{ textAlign: "center" }}
        />
      </Card>
    </Container>
  );
};
