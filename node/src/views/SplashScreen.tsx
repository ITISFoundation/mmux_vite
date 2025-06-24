import {
  Container,
  Card,
  Typography,
  CardHeader,
  useTheme,
  CardMedia,
  LinearProgress,
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
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "8px",
          padding: "0rem",
          margin: "auto",
          backgroundColor: "black",
          border: 'none'
        }}
      >
        <CardMedia
          component="img"
          // image="/NoBackgroundLogo.png"
          image="/BlackLogo.png"
          sx={{
            height: '250px',
          }}
          alt="MetaModelingUX Logo"
        />

        <Typography
        variant="body1"
        fontFamily={"inherit"}
        fontWeight={"200"}
        >
          Starting up service
        </Typography>
        <LinearProgress sx={{ color: theme.palette.primary.main, marginTop: '8px', height: '6px' }} />
      </Card>
    </Container>
  );
};
