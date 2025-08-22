import { useState, useEffect } from "react";
import {
  Box,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  useTheme,
} from "@mui/material";
import { InfoOutline } from "@mui/icons-material";
import CustomTooltip from "../components/utils/CustomTooltip";
import SelectQoIDocument from "../components/documents/SelectQoIDocument";
import { useMMUXContext } from "../context/MMUXContext";
import { useFunctionContext } from "../context/FunctionContext";
import { useJobContext } from "../context/JobContext";

interface UQSetupProps {
  loading: boolean;
  mode?: "onlyQoI" | "full" | "moga";
  setSumoModal?: (value: boolean) => void;
}

export const OutputSetup = (props: UQSetupProps) => {
  const { loading, mode, setSumoModal } = props;
  const theme = useTheme();
  const { selectedFunction, outputVars } = useFunctionContext();
  const { filterSelectedJobList } = useJobContext();
  const { selectedQoI, setSelectedQoI, numSamples, setNumSamples } =
    useMMUXContext();
  const [localQoI, setLocalQoI] = useState<string | undefined>(selectedQoI);
  const [localNumSamples, setLocalNumSamples] = useState(
    numSamples[selectedFunction?.uid || ""] || 10000
  );

  const handlesetLocalQoI = (value: string) => {
    setLocalQoI(value);
    setSelectedQoI(value);
  };

  const handlesetLocalNumSamples = (value: number) => {
    setLocalNumSamples(value);
    setNumSamples({
      ...numSamples,
      [selectedFunction?.uid || ""]: value,
    });
  };

  useEffect(() => {
    setLocalQoI(outputVars?.[0] || "");
  }, [outputVars]); // Update localQoI when selectedQoI changes due to selectedFunction change

  if (mode === "moga" && setSumoModal) {
    return (
      <Box
        sx={{
          justifyContent: "right",
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
          disabled={
            loading || !selectedFunction || filterSelectedJobList().length === 0
          }
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
        gap: "16px",
        color: `${theme.palette.text.primary}`,
        padding: "0px 4px 16px",
        width: mode === "onlyQoI" ? "50%" : "100%",
      }}
    >
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
            ExtendedTootlip={SelectQoIDocument}
            placement="right"
            arrow
          >
            <InfoOutline
              sx={(theme) => ({
                color: theme.palette.primary.light,
                backgroundColor: theme.palette.background.default,
                borderRadius: "50%",
                padding: "2px",
                marginLeft: "4px",
              })}
            />
          </CustomTooltip>
        </Box>
        <Select
          size="small"
          variant="outlined"
          sx={{ flex: 1 }}
          value={localQoI}
          defaultValue={outputVars?.[0] || ""}
          onChange={(e) => {
            handlesetLocalQoI(e.target.value);
          }}
        >
          {outputVars?.map((qoi, idx) => (
            <MenuItem key={idx} value={qoi}>
              {qoi}
            </MenuItem>
          ))}
        </Select>
      </InputLabel>
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
                },
              }}
              sx={{ flex: 1 }}
              value={localNumSamples}
              onChange={(e) =>
                handlesetLocalNumSamples(parseInt(e.target.value))
              }
            />
          </InputLabel>
          <Button
            variant="contained"
            size="small"
            disabled={
              loading ||
              !selectedFunction ||
              filterSelectedJobList().length === 0
            }
            onClick={() => setSumoModal(true)}
            sx={{ padding: "8px 16px" }}
          >
            Inspect Model
          </Button>
        </>
      )}
    </Box>
  );
};
