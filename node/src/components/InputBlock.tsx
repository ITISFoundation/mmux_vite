import { InputLabel, TextField } from "@mui/material";
import { useState } from "react";

export const InputBlock = (props: InputBlockProps) => {
  const { name, value, onChange } = props;
  const [currentValue, setCurrentValue] = useState<number>(value)

  const handleChange = (newValue: number) => {
    onChange(newValue);
  };

  return (
    <InputLabel size="small" sx={{ flex: '1', display: 'flex', flexDirection: 'column', transform: 'none' }}>
      {name}:
      <TextField
        type="number"
        variant="outlined"
        size="small"
        sx={{ marginTop: '8px' }}
        value={currentValue}
        onChange={(e) => setCurrentValue(parseFloat(e.target.value))}
        onBlur={(e) => handleChange(parseFloat(e.target.value))}
      />
    </InputLabel>
  );
}