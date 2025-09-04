import { InputLabel, TextField } from "@mui/material";

export function InputTextBlock(props: InputTextBlockProps) {
  const { name, value, onChange } = props;
  const inputId = `input-${name?.toString().replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <InputLabel size="small" sx={{ flex: "1", display: "flex", flexDirection: "column", transform: "none" }} htmlFor={inputId}>
      {name}:
      <TextField
        id={inputId}
        type="number"
        variant="outlined"
        size="small"
        sx={{ marginTop: "8px" }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </InputLabel>
  );
}
