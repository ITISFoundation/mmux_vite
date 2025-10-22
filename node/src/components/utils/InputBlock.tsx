import { InputLabel, TextField } from "@mui/material";
import { useState } from "react";

export function InputBlock(props: InputBlockProps) {
  const { name, value, type, error, minmax, onChange } = props;
  const [currentValue, setCurrentValue] = useState<number>(value);

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
