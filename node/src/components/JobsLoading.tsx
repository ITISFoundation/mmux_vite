import { Box, Typography, LinearProgress, useTheme } from "@mui/material";
import React from "react";

interface JobsLoadingProps {
  progress: number;
  jobProgress: number;
  message: string;
}

export const JobsLoading = (props: JobsLoadingProps) => {
  const { progress, jobProgress, message } = props;
  const theme = useTheme();

  return (
    <Box
      width={"100%"}
      height={"400px"}
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
        mb={1}
      >
        {message}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <LinearProgress
          variant="determinate"
          value={jobProgress}
          sx={{ height: "6px", width: "40%" }}
        />
      </Box>
      <Typography
        variant="body1"
        fontFamily={"inherit"}
        fontWeight={100}
        textAlign={"center"}
        mt={1}
      >
        <span>{Math.round(jobProgress)}%</span>
      </Typography>
    </Box>
  );
};
