import { IconButton, InputLabel, TextField, useTheme } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useEffect, useState } from "react";

export function InputBlock(props: InputBlockProps) {
  const { name, value, type, error, minmax, onChange, onRefresh, refreshTestId } = props;
  const [currentValue, setCurrentValue] = useState<number>(value);
  const theme = useTheme();

  // B27/B28/B29: the parent can update `value` out-of-band (auto-infer on CSV load,
  // manual distribution-type switch, or a refresh button) without this component
  // remounting; re-sync so the field doesn't keep showing a stale initial value.
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    onChange(newValue);
  };

  return (
    <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }}>
      <span style={{ marginLeft: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {name}:
        {onRefresh && (
          <IconButton
            size="small"
            aria-label={`Refresh ${name}`}
            mmux-testid={refreshTestId || `input-block-${name}-refresh`}
            onClick={onRefresh}
            sx={{ padding: "1px" }}
          >
            <Refresh sx={{ fontSize: "14px", color: theme.palette.text.secondary }} />
          </IconButton>
        )}
      </span>
      <TextField
        type={type || "number"}
        variant="outlined"
        size="small"
        sx={{ marginTop: "8px" }}
        mmux-testid={`input-block-${name}`}
        InputProps={{ inputProps: { min: minmax.min, max: minmax.max } }}
        color="primary"
        value={Number.isNaN(currentValue) ? "" : currentValue}
        onChange={e => setCurrentValue(parseFloat(e.target.value))}
        onBlur={e => handleChange(parseFloat(e.target.value))}
        aria-label={name}
        error={error || currentValue > minmax.max || currentValue < minmax.min}
      />
    </InputLabel>
  );
}
