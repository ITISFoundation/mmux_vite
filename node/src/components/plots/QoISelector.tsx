import { Box, InputLabel, MenuItem, Select, useTheme } from "@mui/material";
import { InfoOutline } from "@mui/icons-material";
import CustomTooltip from "../utils/CustomTooltip";
import SelectQoIDocument from "../documents/SelectQoIDocument";

type QoISelectorProps = {
  outputVars: string[];
  selectedQoI: string | undefined;
  setSelectedQoI: (value: string) => void;
  testId?: string;
};

export function QoISelector({ outputVars, selectedQoI, setSelectedQoI, testId = "qoi-select" }: QoISelectorProps) {
  const theme = useTheme();

  return (
    <InputLabel
      size="small"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transform: "none",
        fontFamily: "inherit",
        fontWeight: 300,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
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
        sx={{ minWidth: 120 }}
        value={selectedQoI || ""}
        onChange={event => setSelectedQoI(event.target.value)}
        mmux-testid={testId}
      >
        {outputVars.map(qoi => (
          <MenuItem key={`qoi-${qoi}`} value={qoi}>
            {qoi}
          </MenuItem>
        ))}
      </Select>
    </InputLabel>
  );
}
