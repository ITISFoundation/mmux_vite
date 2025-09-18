import { InputLabel, Typography, Select, MenuItem } from "@mui/material";

interface OptionSelectorProps<T> {
  property: string;
  possibleValues: Array<{ key: T; label: string }>;
  currentValue: T | undefined;
  setCurrentValue: (value: T) => void;
}

export default function OptionSelector<T>({ property, possibleValues, currentValue, setCurrentValue }: OptionSelectorProps<T>) {
  return (
    <InputLabel sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
        {property || ""}:
      </Typography>
      <Select
        labelId="select-key1"
        id="select-key1"
        size="small"
        defaultValue=""
        value={currentValue as string}
        onChange={e => setCurrentValue(e.target.value as T)}
        sx={{ flex: 1 }}
      >
        {possibleValues.map(({ key, label }, _idx) => (
          <MenuItem key={key as string} value={key as string}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </InputLabel>
  );
}
