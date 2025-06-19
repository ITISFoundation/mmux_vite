import { Box, Typography, useTheme } from "@mui/material";
import React from "react";

type DisplayMessageProps = {
  mssg: string;
  children?: React.ReactNode;
  height?: number;
};

export const DisplayMessage = (props: DisplayMessageProps) => {
  const theme = useTheme();
  const { mssg, children, height } = props;
  return (
    <Box
      width={"100%"}
      height={height ? height : "400px"}
      display={"flex"}
      flexDirection={"column"}
      alignItems={"center"}
      justifyContent={"center"}
      bgcolor={theme.palette.background.default}
      borderRadius={"8px"}
    >
      <Typography
        variant="body1"
        fontFamily={"inherit"}
        fontWeight={100}
        textAlign={"center"}
      >
        {mssg}
      </Typography>
      {children}
    </Box>
  );
};
