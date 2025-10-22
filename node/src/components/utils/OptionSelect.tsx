import { InfoOutline } from "@mui/icons-material";
import { InputLabel, Typography, Select, MenuItem, useTheme } from "@mui/material";
import CustomTooltip from "./CustomTooltip";

interface OptionSelectorProps<T> {
  property: string;
  possibleValues: Array<{ key: T; label: string }>;
  currentValue: T | undefined;
  setCurrentValue: (value: T) => void;
  title?: React.ReactNode;
  extendedTooltip?: React.ReactElement;
}

export default function OptionSelector<T>({
  property,
  possibleValues,
  currentValue,
  setCurrentValue,
  title,
  extendedTooltip,
}: OptionSelectorProps<T>) {
  const theme = useTheme();
  return (
    <InputLabel sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
        {property || ""}
        <CustomTooltip title={title} ExtendedTooltip={extendedTooltip} placement="right" arrow>
          <InfoOutline
            sx={{
              color: theme.palette.primary.light,
              backgroundColor: theme.palette.background.default,
              borderRadius: "50%",
              padding: "2px",
              marginLeft: "2px",
              marginRight: "2px",
              marginBottom: "2px",
              fontSize: "20px",
            }}
          />
        </CustomTooltip>
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
