/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { Modal, useTheme, Card, Box, CardContent, Button, CardActions, InputLabel, TextField } from "@mui/material";
import Header from "../components/navigation/Header";
import { useMMUXContext } from "../context/MMUXContext";
import { useFunctionContext } from "../context/FunctionContext";

const MOGAModal = ({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) => {
  const theme = useTheme();
  const { selectedFunction } = useFunctionContext();
  const { numSamples, setNumSamples, numIterations, setNumIterations, crossover, setCrossover } = useMMUXContext();

  const [samples, setSamples] = React.useState<number>(numSamples[selectedFunction?.uid || ""] || 10000);
  const [iterations, setIterations] = React.useState<number>(numIterations[selectedFunction?.uid || ""] || 100);
  const [crossoverRate, setCrossoverRate] = React.useState<number>(crossover[selectedFunction?.uid || ""] || 0.8);

  const resetFields = () => {
    setSamples(numSamples[selectedFunction?.uid || ""] || 10000);
    setIterations(numIterations[selectedFunction?.uid || ""] || 100);
    setCrossoverRate(crossover[selectedFunction?.uid || ""] || 0.8);
  };

  const handleSetData = () => {
    const newNumSamples = { ...numSamples, [selectedFunction?.uid || ""]: samples };
    setNumSamples(newNumSamples);
    const newNumIterations = { ...numIterations, [selectedFunction?.uid || ""]: iterations };
    setNumIterations(newNumIterations);
    const newCrossover = { ...crossover, [selectedFunction?.uid || ""]: crossoverRate };
    setCrossover(newCrossover);
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
        maxWidth: "480px",
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", padding: "0px 8px" }}>
            <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }}>
              <span style={{ marginLeft: "4px" }}>Samples:</span>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ marginTop: "8px" }}
                data-testid="input-block"
                value={Number.isNaN(samples) ? "" : samples}
                onChange={e => setSamples(parseFloat(e.target.value))}
                onBlur={e => setSamples(parseFloat(e.target.value))}
                aria-label="Samples"
                error={false}
              />
            </InputLabel>
            <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }}>
              <span style={{ marginLeft: "4px" }}>Iterations:</span>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ marginTop: "8px" }}
                data-testid="input-block"
                value={Number.isNaN(iterations) ? "" : iterations}
                onChange={e => setIterations(parseFloat(e.target.value))}
                onBlur={e => setIterations(parseFloat(e.target.value))}
                aria-label="Iterations"
                error={false}
              />
            </InputLabel>
            <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }}>
              <span style={{ marginLeft: "4px" }}>Crossover Rate:</span>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ marginTop: "8px" }}
                data-testid="input-block"
                value={Number.isNaN(crossoverRate) ? "" : crossoverRate}
                onChange={e => setCrossoverRate(parseFloat(e.target.value))}
                onBlur={e => setCrossoverRate(parseFloat(e.target.value))}
                aria-label="Crossover Rate"
                error={false}
              />
            </InputLabel>
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

export default MOGAModal;
