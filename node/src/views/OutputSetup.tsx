import { useState, useEffect } from "react";
import { Box, InputLabel, Select, MenuItem, TextField, Button, Typography, useTheme } from "@mui/material";
import InfoOutline from "@mui/icons-material/InfoOutline";
import CustomTooltip from "../components/utils/CustomTooltip";
import SelectQoIDocument from "../components/documents/SelectQoIDocument";
import { useMMUXContext } from "../context/MMUXContext";
import { useFunctionContext } from "../context/FunctionContext";
import { useJobContext } from "../context/JobContext";
import { CustomAnimatedToggle } from "../components/utils/CustomAnimatedToggle";

interface UQSetupProps {
  loading: boolean;
  mode?: "onlyQoI" | "full" | "moga";
  setSumoModal?: (value: boolean) => void;
  setMogaModal?: (value: boolean) => void;
}

export function OutputSetup(props: UQSetupProps) {
  const { loading, mode, setSumoModal, setMogaModal } = props;
  const theme = useTheme();
  const { selectedFunction, outputVars, outputLogScales, setOutputLogScales } = useFunctionContext();
  const { filteredJobList } = useJobContext();
  const { selectedQoI, setSelectedQoI, numSamples, setNumSamples } = useMMUXContext();
  const selectedFunctionUid = selectedFunction?.uid;
  const [localQoI, setLocalQoI] = useState<string>(selectedQoI ?? "");
  const [localNumSamples, setLocalNumSamples] = useState(10000);

  const currentQoILogScale = selectedFunctionUid ? Boolean(outputLogScales[selectedFunctionUid]?.[localQoI]) : false;

  const handlesetLocalQoI = (value: string) => {
    setLocalQoI(value);
    setSelectedQoI(value);
  };

  const handleSetQoILogScale = (value: boolean) => {
    if (!localQoI || !selectedFunctionUid) return;
    const current = outputLogScales[selectedFunctionUid] || {};
    setOutputLogScales({ ...outputLogScales, [selectedFunctionUid]: { ...current, [localQoI]: value } });
  };

  const handlesetLocalNumSamples = (value: number) => {
    setLocalNumSamples(value);
    if (!selectedFunctionUid) {
      return;
    }
    setNumSamples({
      ...numSamples,
      [selectedFunctionUid]: value,
    });
  };

  useEffect(() => {
    if (!selectedFunctionUid) {
      setLocalQoI("");
      setSelectedQoI(undefined);
      return;
    }

    setLocalQoI(outputVars[0] || "");
    if (mode === "moga") {
      setSelectedQoI(outputVars[0] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, outputVars, selectedFunctionUid]);

  useEffect(() => {
    if (!selectedFunctionUid) {
      setLocalNumSamples(10000);
      return;
    }

    setLocalNumSamples(numSamples[selectedFunctionUid] || 10000);
  }, [numSamples, selectedFunctionUid]);

  if (mode === "moga" && setSumoModal && setMogaModal) {
    return (
      <Box
        sx={{
          justifyContent: "space-between",
          flex: 1,
          display: "flex",
          gap: "16px",
          color: `${theme.palette.text.primary}`,
          padding: "0px 4px 16px",
          width: "100%",
        }}
      >
        <Button
          variant="contained"
          size="small"
          disabled={loading || !selectedFunction || filteredJobList.length === 0}
          onClick={() => setMogaModal(true)}
          sx={{ padding: "8px 16px" }}
        >
          Optimization Settings
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={loading || !selectedFunction || filteredJobList.length === 0}
          onClick={() => setSumoModal(true)}
          sx={{ padding: "8px 16px" }}
        >
          Inspect Model
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        justifySelf: "left",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        color: `${theme.palette.text.primary}`,
        padding: "0px 4px 16px",
        width: mode === "onlyQoI" ? "50%" : "100%",
      }}
    >
      <Box sx={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <InputLabel
          size="small"
          sx={{
            display: "flex",
            flex: 1,
            transform: "none",
            alignItems: "baseline",
            gap: "8px",
            fontFamily: "inherit",
            fontWeight: 300,
            fontSize: "1.2em",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            Select Quantity of Interest
            <CustomTooltip
              title="Choose the simulation output to analyze"
              extendedTooltip={SelectQoIDocument}
              placement="right"
              arrow
            >
              <InfoOutline
                sx={{
                  color: theme.palette.primary.light,
                  backgroundColor: theme.palette.background.default,
                  borderRadius: "50%",
                  padding: "2px",
                  marginLeft: "4px",
                }}
              />
            </CustomTooltip>
          </Box>
          <Select
            size="small"
            variant="outlined"
            sx={{ flex: 1 }}
            value={localQoI}
            defaultValue={outputVars[0] || ""}
            onChange={e => {
              handlesetLocalQoI(e.target.value);
            }}
            mmux-testid="qoi-select"
          >
            {outputVars.map(qoi => (
              <MenuItem key={`qoi-${qoi}`} value={qoi}>
                {qoi}
              </MenuItem>
            ))}
          </Select>
        </InputLabel>
        {localQoI && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Typography sx={{ fontSize: "0.75em", fontWeight: 300, color: theme.palette.text.secondary }}>
              Surrogate scale
            </Typography>
            <CustomAnimatedToggle
              data={["linear", "log"]}
              value={currentQoILogScale ? 1 : 0}
              disabled={false}
              onChange={value => handleSetQoILogScale(value === 1)}
            />
          </Box>
        )}
        {mode !== "onlyQoI" && setSumoModal && (
          <>
            <InputLabel
              size="small"
              sx={{
                display: "flex",
                flex: 1,
                transform: "none",
                alignItems: "baseline",
                gap: "16px",
                fontFamily: "inherit",
                fontWeight: 300,
                fontSize: "1.2em",
              }}
            >
              Number of UQ Samples:
              <TextField
                type="number"
                variant="outlined"
                size="small"
                InputProps={{
                  inputProps: {
                    min: 1,
                    max: 1000000,
                  },
                }}
                sx={{ flex: 1 }}
                value={localNumSamples}
                onChange={e => {
                  const value = Math.max(1, Math.min(1000000, parseInt(e.target.value, 10)));
                  return handlesetLocalNumSamples(value);
                }}
              />
            </InputLabel>
            <Button
              variant="contained"
              size="small"
              disabled={loading || !selectedFunction || filteredJobList.length === 0}
              onClick={() => setSumoModal(true)}
              sx={{ padding: "8px 16px" }}
              mmux-testid="inspect-model-button"
            >
              Inspect Model
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
