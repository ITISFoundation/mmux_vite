import { InputLabel, TextField } from "@mui/material";
import { useEffect, useState } from "react";

function normalizeNumericValue(value: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
}

export function InputBlock(props: InputBlockProps) {
  const { name, value, type, error, minmax, onChange } = props;
  const [currentValue, setCurrentValue] = useState<number>(() => normalizeNumericValue(value));

  useEffect(() => {
    setCurrentValue(normalizeNumericValue(value));
  }, [value]);

  const handleChange = (newValue: number) => {
    onChange(newValue);
  };

  return (
    <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }}>
      <span style={{ marginLeft: "4px" }}>{name}:</span>
      <TextField
        type={type || "number"}
        variant="outlined"
        size="small"
        sx={{ marginTop: "8px" }}
        mmux-testid={`input-block-${name}`}
        InputProps={{
          inputProps: {
            min: minmax.min,
            max: minmax.max,
            ...(type === undefined || type === "number" ? { step: "any" } : {}),
          },
        }}
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
