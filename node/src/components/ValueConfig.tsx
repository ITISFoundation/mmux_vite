import { Box, Typography, Chip, useTheme } from "@mui/material";
import { InputBlock } from "./InputBlock";

const VariableConfig = ({
  inputVar,
  index,
  handleInputChange,
}: {
  inputVar: SingleJobConfig;
  index: number;
  handleInputChange: (index: number, field: string, value: string) => void;
}) => {
  const theme = useTheme();

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
        />
      </Typography>
      <InputBlock
        name="Value"
        type="number"
        value={inputVar.value !== undefined ? inputVar.value : NaN}
        onChange={(n) => handleInputChange(index, "start", n as string)}
      />
    </Box>
  );
};

export default VariableConfig;
