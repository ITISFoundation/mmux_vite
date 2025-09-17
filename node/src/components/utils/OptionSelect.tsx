import { InputLabel, Typography, Select, MenuItem, TextField, styled, Slider } from "@mui/material";

interface OptionSelectorProps {
    property: string,
    possibleValues: { key: string }; // internal key & display string
    currentValue: string | undefined; // internal key
    setCurrentValue: (value: string) => void; // internal key
}

export default function OptionSelector({ property, possibleValues, currentValue, setCurrentValue }: OptionSelectorProps) {
    return (
        <InputLabel sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="h6" component="p" fontFamily="inherit" fontWeight={100}>
                {property || ""}:
            </Typography>
            <Select
                labelId="select-key1"
                id="select-key1"
                size="small"
                defaultValue=""
                value={currentValue}
                onChange={e => setCurrentValue(e.target.value)}
            >
                {Object.entries(possibleValues)
                    .map(([key, value], _idx) => (
                        <MenuItem key={key} value={value} />
                    ))}
            </Select>
        </InputLabel>
    );
}