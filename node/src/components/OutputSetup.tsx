import React, { useState } from "react";
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
import CustomTooltip from "./CustomTooltip";
import SelectQoIDocument from "./documents/SelectQoIDocument";
import { useMMUXContext } from "../context/MMUXContext";

interface UQSetupProps {
  loading: boolean;
  onlyQoI?: boolean;
  setSumoModal?: (value: boolean) => void;
}

export const OutputSetup = (props: UQSetupProps) => {
  const { loading, onlyQoI, setSumoModal } = props;
  const theme = useTheme();
  const {
    selectedQoI,
    setSelectedQoI,
    outputVars,
    selectedFunction,
    numSamples,
    setNumSamples,
    filterSelectedJobList,
  } = useMMUXContext();
  const [localQoI, setLocalQoI] = useState<string | undefined>(selectedQoI);
  const [localNumSamples, setLocalNumSamples] = useState(
    numSamples[selectedFunction?.uid || ""] || 1000
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

  return (
    <Box
      sx={{
        justifySelf: "left",
        flex: 1,
        display: "flex",
        gap: "16px",
        color: `${theme.palette.text.primary}`,
        marginBottom: "16px",
        width: onlyQoI ? "50%" : "100%",
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
            title="Choose the simulation output to analyze for uncertainty propagation"
            ExtendedTootlip={SelectQoIDocument}
            placement="right"
            arrow
          >
            <InfoOutline
              sx={(theme) => ({
                color: theme.palette.text.secondary,
                backgroundColor: theme.palette.grey[100],
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
          sx={{ flex: 1, marginTop: "8px" }}
          value={localQoI}
          defaultValue={outputVars?.[0] || ""}
          onChange={(e) => {
            handlesetLocalQoI(e.target.value);
          }}
        >
          {outputVars?.map((qoi) => (
            <MenuItem key={qoi} value={qoi}>
              {qoi}
            </MenuItem>
          ))}
        </Select>
      </InputLabel>
      {onlyQoI && setSumoModal && (
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
              sx={{ marginTop: "8px", flex: 1 }}
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
            sx={{
              marginTop: "8px",
              width: "160px",
              fontSize: "1.1em",
              fontFamily: "inherit",
              fontWeight: 200,
              textTransform: "none",
            }}
            color="primary"
            onClick={() => setSumoModal(true)}
          >
            Inspect Model
          </Button>
        </>
      )}
    </Box>
  );
};
