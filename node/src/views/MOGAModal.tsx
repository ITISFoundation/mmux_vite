/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { Modal, useTheme, Card, Box, CardContent, Button, Select, CardActions, InputLabel, TextField } from "@mui/material";
import Header from "../components/navigation/Header";
import OptionSelect from "../components/utils/OptionSelect";
import { useMOGASettingsContext, defaultMogaSettings, MOGASettings, FitnessType, ReplacementType } from "../context/MOGASettingsContext";
import { useFunctionContext } from "../context/FunctionContext";

const MOGAModal = ({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) => {
  const theme = useTheme();
  const { selectedFunction } = useFunctionContext();
  const { mogaSettings, setMOGASettings } = useMOGASettingsContext();
  const [populationSize, setPopulationSize] = React.useState<number>(mogaSettings[selectedFunction?.uid || ""]?.populationSize || defaultMogaSettings[""].populationSize);
  const [maxIterations, setMaxIterations] = React.useState<number>(mogaSettings[selectedFunction?.uid || ""]?.maxIterations || defaultMogaSettings[""].maxIterations);
  const [fitnessType, setFitnessType] = React.useState<FitnessType>(mogaSettings[selectedFunction?.uid || ""]?.fitnessType || defaultMogaSettings[""].fitnessType);
  const [replacementType, setReplacementType] = React.useState<ReplacementType>(mogaSettings[selectedFunction?.uid || ""]?.replacementType || defaultMogaSettings[""].replacementType);

  const resetFields = () => {
    setPopulationSize(mogaSettings[selectedFunction?.uid || ""]?.populationSize || defaultMogaSettings[""].populationSize);
    setMaxIterations(mogaSettings[selectedFunction?.uid || ""]?.maxIterations || defaultMogaSettings[""].maxIterations);
    setFitnessType(mogaSettings[selectedFunction?.uid || ""]?.fitnessType || defaultMogaSettings[""].fitnessType);
    setReplacementType(mogaSettings[selectedFunction?.uid || ""]?.replacementType || defaultMogaSettings[""].replacementType);
  };

  const handleSetData = () => {
    const newMogaSettings: MOGASettings = {
      ...mogaSettings,
      [selectedFunction?.uid || ""]: {
        populationSize: populationSize,
        maxIterations: maxIterations,
        fitnessType: fitnessType,
        replacementType: replacementType,
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
            <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }}>
              <span style={{ marginLeft: "4px" }}>Population Size:</span>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ marginTop: "8px" }}
                data-testid="input-block"
                value={Number.isNaN(populationSize) ? "" : populationSize}
                onChange={e => setPopulationSize(parseInt(e.target.value, 10))}
                onBlur={e => setPopulationSize(parseInt(e.target.value, 10))}
                aria-label="Population Size"
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
                value={Number.isNaN(maxIterations) ? "" : maxIterations}
                onChange={e => setMaxIterations(parseInt(e.target.value, 10))}
                onBlur={e => setMaxIterations(parseInt(e.target.value, 10))}
                aria-label="Iterations"
                error={false}
              />
            </InputLabel>
            <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }}>
              <span style={{ marginLeft: "4px" }}>Fitness Type:</span>

              {/* FIXME please @alexpargon fix the looks & behaviour of these Select elements */}
              <OptionSelect
                property={"Fitness Type"}
                currentValue={fitnessType}
                setCurrentValue={setFitnessType}
                possibleValues={
                  {
                    "layer_rank": "Layer Rank",
                    "domination_count": "Domination Count"
                  }
                }
              >
              </OptionSelect>
            </InputLabel>

            <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }}>
              <span style={{ marginLeft: "4px" }}>Replacement Type:</span>

              {/* FIXME please @alexpargon fix the looks & behaviour of these Select elements */}
              <OptionSelect
                property={"Replacement Type"}
                currentValue={replacementType}
                setCurrentValue={setReplacementType}
                possibleValues={{
                  "elitist": "Elitist",
                  "roulette_wheel": "Roulette Wheel",
                  "unique_roulette_wheel": "Unique Roulette Wheel",
                  "below_limit": "Below Limit"
                }}
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
