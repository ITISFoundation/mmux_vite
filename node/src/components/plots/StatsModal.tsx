import React from "react";
import { Box, Card, CardContent, useTheme } from "@mui/material";
import Modal from "@mui/material/Modal";
import Header from "../navigation/Header";

type StatsModalProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  title: string;
  testId: string;
  children: React.ReactNode;
};

/**
 * Shared "stats modal" shell primitive (V22, ../../SPEC.md T32/../flaskapi/SPEC.md T24/node T34):
 * modal wrapper + title, content differs per mode (SuMo Stats step is rendered inside the
 * existing `SuMoModal`/`SteppedPlotCard` stepper instead of this shell; this shell backs the
 * standalone UQ Stats modal).
 */
function StatsModal(props: StatsModalProps) {
  const { open, setOpen, title, testId, children } = props;
  const theme = useTheme();

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby={`${testId}-title`}
      aria-describedby={`${testId}-description`}
    >
      <Box
        mmux-testid={testId}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          maxWidth: "720px",
          maxHeight: "80%",
          overflow: "auto",
        }}
      >
        <Card sx={{ overflow: "auto", backgroundImage: "none" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Header headerType="titleNoMargin" tabTitle={title} />
          </Box>
          <CardContent
            sx={{
              padding: 0,
              margin: "16px 0px",
              borderRadius: theme.spacing(2),
              overflow: "hidden",
            }}
          >
            {children}
          </CardContent>
        </Card>
      </Box>
    </Modal>
  );
}

export default StatsModal;
