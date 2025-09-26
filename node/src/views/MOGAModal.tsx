/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import { Modal, useTheme, Card, Box, CardContent, Button, CardActions, InputLabel, Typography, TextField } from "@mui/material";
import Header from "../components/navigation/Header";
import OptionSelect from "../components/utils/OptionSelect";
import {
  useMOGASettingsContext,
  defaultMogaValues,
  MOGASettings,
  FitnessType,
  ReplacementType,
} from "../context/MOGASettingsContext";
import { useFunctionContext } from "../context/FunctionContext";

const MOGAModal = ({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) => {
  const theme = useTheme();
  const { selectedFunction } = useFunctionContext();
  const { mogaSettings, setMOGASettings } = useMOGASettingsContext();
  const [populationSize, setPopulationSize] = useState<number>(
    mogaSettings[selectedFunction?.uid || ""]?.populationSize || defaultMogaValues.populationSize,
  );
  const [maxIterations, setMaxIterations] = useState<number>(
    mogaSettings[selectedFunction?.uid || ""]?.maxIterations || defaultMogaValues.maxIterations,
  );
  const [fitnessType, setFitnessType] = useState<FitnessType>(
    mogaSettings[selectedFunction?.uid || ""]?.fitnessType || defaultMogaValues.fitnessType,
  );
  const [replacementType, setReplacementType] = useState<ReplacementType>(
    mogaSettings[selectedFunction?.uid || ""]?.replacementType || defaultMogaValues.replacementType,
  );

  const popSizeError = populationSize < 1 || populationSize > 1000000;
  const iterError = maxIterations < 1 || maxIterations > 1000000;

  const resetFields = () => {
    setPopulationSize(mogaSettings[selectedFunction?.uid || ""]?.populationSize || defaultMogaValues.populationSize);
    setMaxIterations(mogaSettings[selectedFunction?.uid || ""]?.maxIterations || defaultMogaValues.maxIterations);
    setFitnessType(mogaSettings[selectedFunction?.uid || ""]?.fitnessType || defaultMogaValues.fitnessType);
    setReplacementType(mogaSettings[selectedFunction?.uid || ""]?.replacementType || defaultMogaValues.replacementType);
  };

  const handleSetData = () => {
    const newMogaSettings: MOGASettings = {
      ...mogaSettings,
      [selectedFunction?.uid || ""]: {
        populationSize,
        maxIterations,
        fitnessType,
        replacementType,
        seed: 42,
      },
    };
    setMOGASettings(newMogaSettings);
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
            <InputLabel
              size="small"
              sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
            >
              <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                Population Size:
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                mmux-testid="input-block"
                InputProps={{ inputProps: { min: 1, max: 1000000 } }}
                error={popSizeError}
                value={Number.isNaN(populationSize) ? "" : populationSize}
                onChange={e => setPopulationSize(parseInt(e.target.value, 10))}
                aria-label="Population Size"
              />
            </InputLabel>
            <InputLabel
              size="small"
              sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
            >
              <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                Iterations:
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                mmux-testid="input-block"
                InputProps={{ inputProps: { min: 1, max: 1000000 } }}
                error={iterError}
                value={Number.isNaN(maxIterations) ? "" : maxIterations}
                onChange={e => setMaxIterations(parseInt(e.target.value, 10))}
                aria-label="Iterations"
              />
            </InputLabel>
            <OptionSelect
              property="Fitness Type"
              currentValue={fitnessType}
              setCurrentValue={setFitnessType}
              possibleValues={[
                { key: "layer_rank", label: "Layer Rank" },
                { key: "domination_count", label: "Domination Count" },
              ]}
            />
            <OptionSelect
              property="Replacement Type"
              currentValue={replacementType}
              setCurrentValue={setReplacementType}
              possibleValues={[
                { key: "elitist", label: "Elitist" },
                { key: "roulette_wheel", label: "Roulette Wheel" },
                { key: "unique_roulette_wheel", label: "Unique Roulette Wheel" },
                { key: "below_limit", label: "Below Limit" },
              ]}
            />
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
            disabled={popSizeError || iterError || !selectedFunction}
          >
            Apply
          </Button>
        </CardActions>
      </Card>
    </Modal>
  );
};

export default MOGAModal;
