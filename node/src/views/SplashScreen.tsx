import {
  Container,
  Card,
  Typography,
  CircularProgress,
  CardHeader,
} from "@mui/material";
import React from "react";

export const SplashScreen = () => {
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
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "16px",
          padding: "2rem",
          height: "20vh",
          margin: "auto",
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
        <CircularProgress size="3rem" />
        <CardHeader
          title={
            <Typography
              variant="body1"
              fontFamily={"inherit"}
              fontWeight={"200"}
            >
              Waiting for backend
            </Typography>
          }
          style={{ textAlign: "center" }}
        />
      </Card>
    </Container>
  );
};
