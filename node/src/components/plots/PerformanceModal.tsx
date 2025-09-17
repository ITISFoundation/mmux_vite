/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { Modal, useTheme, Card, Box, CardContent, Button, CardActions, Typography, Slider } from "@mui/material";
import Header from "../navigation/Header";

const PerformanceModal = ({
  weights,
  open,
  setOpen,
  onChange,
}: {
  weights: { [key: string]: number };
  open: boolean;
  setOpen: (value: boolean) => void;
  onChange: (newWeights: { [key: string]: number }) => void;
}) => {
  const theme = useTheme();
  const [localWeights, setLocalWeights] = React.useState(weights || {});

  const resetFields = () => {
    setLocalWeights(weights);
  };
  const handleSetData = () => {
    onChange(localWeights);
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        margin: "auto",
        width: "80%",
        maxWidth: "680px",
        height: "80%",
      }}
    >
      <Card
        sx={{
          overflow: "auto",
          backgroundImage: "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Header
            headerType="titleNoMargin"
            tabTitle="Optimization Configuration"
            infoText="Configure the optimization settings for MOGA."
          />
        </Box>
        <CardContent
          sx={{
            padding: 0,
            margin: "16px 0px",
            borderRadius: theme.spacing(2),
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", padding: "0px 8px", justifyItems: "space-between" }}>
            {Object.keys(weights).map(key => (
              <Box key={key} sx={{ flex: 1, display: "flex", flexDirection: "row", gap: "8px" }}>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {key.toUpperCase()}
                </Typography>
                <Box sx={{ flex: 2, display: "flex", alignItems: "center", gap: "16px", width: "100%", justifyContent: "end" }}>
                  <Slider
                    value={localWeights[key]}
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={0.5}
                    onChange={(_event, newValue) => {
                      setLocalWeights(prev => ({ ...prev, [key]: newValue }));
                    }}
                    valueLabelDisplay="auto"
                    aria-labelledby={`slider-${key}`}
                  />
                  <span>{localWeights[key].toFixed(2)}</span>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
        <CardActions sx={{ padding: 0, display: "flex", justifyContent: "space-between" }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              resetFields();
              setOpen(false);
            }}
            sx={{ alignItems: "start" }}
          >
            Close
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              handleSetData();
              setOpen(false);
            }}
            sx={{ alignItems: "end" }}
          >
            Apply
          </Button>
        </CardActions>
      </Card>
    </Modal>
  );
};

export default PerformanceModal;
