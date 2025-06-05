import { InputLabel, TextField } from "@mui/material";

export const InputTextBlock = (props: InputTextBlockProps) => {
    const { name, value, onChange } = props;
    return (
      <InputLabel size="small" sx={{ flex: '1', display: 'flex', flexDirection: 'column', transform: 'none' }}>
        {name}:
        <TextField
          type="number"
          variant="outlined"
          size="small"
          sx={{ marginTop: '8px' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </InputLabel>
    );
  }