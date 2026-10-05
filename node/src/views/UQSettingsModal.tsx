import { useEffect, useState } from "react";
import { Box, Button, Modal, TextField, Typography } from "@mui/material";
import { useFunctionContext } from "../context/FunctionContext";
import { useMMUXContext } from "../context/MMUXContext";
import { UQSettings } from "../context/types";
import { clampUQSettings, defaultUQSettings } from "../utils/uqSettings";

function UQSettingsModal({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const { selectedFunction } = useFunctionContext();
  const { uqSettings, setUQSettings } = useMMUXContext();
  const functionId = selectedFunction?.uid || "";
  const [settings, setSettings] = useState(defaultUQSettings);

  useEffect(() => {
    setSettings({ ...defaultUQSettings, ...uqSettings[functionId] });
  }, [functionId, uqSettings, open]);

  const update = (field: keyof UQSettings, value: string) => {
    const numericValue = Math.max(0, Number.parseInt(value, 10) || 0);
    setSettings(current => ({ ...current, [field]: numericValue }));
  };

  const save = () => {
    // HTML min/max do not clamp typed input; enforce the declared
    // ranges before anything is persisted or hits backend computation.
    setUQSettings({ ...uqSettings, [functionId]: clampUQSettings(settings) });
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="uq-settings-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 360,
          bgcolor: "background.paper",
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        mmux-testid="uq-settings-modal"
      >
        <Typography id="uq-settings-title" variant="h6">
          UQ Settings
        </Typography>
        <TextField
          label="Number of UQ Samples"
          type="number"
          inputProps={{ min: 1, max: 1000000 }}
          value={settings.numSamples}
          onChange={event => update("numSamples", event.target.value)}
        />
        <TextField
          label="Number of Histograms"
          type="number"
          inputProps={{ min: 1, max: 1000 }}
          value={settings.nHistograms}
          onChange={event => update("nHistograms", event.target.value)}
        />
        <TextField
          label="Seed"
          type="number"
          inputProps={{ min: 0, max: 1000000 }}
          value={settings.seed}
          onChange={event => update("seed", event.target.value)}
        />
        <Button variant="contained" onClick={save}>
          Save
        </Button>
      </Box>
    </Modal>
  );
}

export default UQSettingsModal;
