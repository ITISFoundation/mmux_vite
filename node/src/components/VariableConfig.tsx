import { Box, Typography, Chip, useTheme } from "@mui/material";
import { InputBlock } from "./InputBlock";

interface VariableConfigProps {
  inputVar: SamplingInputsState;
  index: number;
  handleInputChange: (index: number, field: fieldType, value: string) => void;
}

const VariableConfig = (props: VariableConfigProps) => {
  const theme = useTheme();
  const { inputVar, index, handleInputChange } = props;

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        flex: 1,
        maxWidth: "240px",
        minWidth: "240px",
        padding: "8px 8px 16px",
        marginRight: "16px",
        backgroundColor: theme.palette.background.default,
        border: `1px solid ${theme.palette.background.paper}`,
        gap: "16px",
        borderRadius: "8px",
      })}
    >
      <Typography variant="h6" sx={{ fontSize: "1.2em" }}>
        <Chip
          label={inputVar.variable}
          sx={{
            width: "100%",
            fontSize: "0.8em",
            fontWeight: "100",
            textTransform: "uppercase",
            borderRadius: "8px",
            backgroundColor: theme.palette.primary.main,
          }}
        ></Chip>
      </Typography>
      <InputBlock
        name="Start"
        value={inputVar.start}
        onChange={(n) => handleInputChange(index, "start", n as string)}
      />
      <InputBlock
        name="End"
        value={inputVar.end}
        onChange={(n) => handleInputChange(index, "end", n as string)}
      />
    </Box>
  );
};

export default VariableConfig;
