import { Box, Chip, InputLabel, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import { InputBlock } from "./InputBlock";

export const InputVariableDist = () => {
  const { inputVars, distribution, setDistribution } = useMMUXContext();
  const theme = useTheme();

  const handleSetValue = (inputVar: string, type: string, value: number) => {
    const newInputVars = { ...distribution };
    if (!newInputVars[inputVar]) {
      newInputVars[inputVar] = { distribution: "normal" };
    }
    newInputVars[inputVar][type as variables] = value;
    setDistribution(newInputVars);
  }

  const ConstantInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <InputBlock
        name="Value"
        value={distribution[inputVar].value !== undefined ? distribution[inputVar].value : NaN}
        onChange={(value) => handleSetValue(inputVar, 'value', value)}
      />
    );
  }

  const NormalInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <>
        <InputBlock
          name="Mean"
          value={distribution[inputVar].mean !== undefined ? distribution[inputVar].mean : NaN}
          onChange={(value) => handleSetValue(inputVar, 'mean', value)}
        />
        <InputBlock
          name="Standard Deviation"
          value={distribution[inputVar].std !== undefined ? distribution[inputVar].std : NaN}
          onChange={(value) => handleSetValue(inputVar, 'std', value)}
        />
      </>
    );
  }

  const UniformInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <>
        <InputBlock
          name="Min"
          value={distribution[inputVar].min !== undefined ? distribution[inputVar].min : NaN}
          onChange={(value) => handleSetValue(inputVar, 'min', value)}
        />
        <InputBlock
          name="Max"
          value={distribution[inputVar].max !== undefined ? distribution[inputVar].max : NaN}
          onChange={(value) => handleSetValue(inputVar, 'max', value)}
        />
      </>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const LogNormalInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <>
        <InputBlock
          name="Log Location"
          value={distribution[inputVar].location !== undefined ? distribution[inputVar].location : NaN}
          onChange={(value) => handleSetValue(inputVar, 'location', value)}
        />
        <InputBlock
          name='Log Scale'
          value={distribution[inputVar].scale !== undefined ? distribution[inputVar].scale : NaN}
          onChange={(value) => handleSetValue(inputVar, 'scale', value)}
        />
      </>
    );
  }


  const handleDistributionChange = (inputVar: string, value: distribution) => {
    const newInputVars = { ...distribution };
    const newDist: VarSelection = { distribution: value };
    newInputVars[inputVar] = newDist;
    setDistribution(newInputVars);
  };

  useEffect(() => {
    console.log("InputVariableDist useEffect", distribution);
    if (distribution) {
      setDistribution(distribution);
    }
  }, [distribution, setDistribution]);

  useEffect(() => {
    if (inputVars.length > 0 && Object.keys(distribution).length === 0) {
      const initialInputVars = inputVars.reduce((acc, val) => {
        acc[val] = { distribution: "normal" };
        return acc;
      }, {} as typeof distribution);
      setDistribution(initialInputVars);
    }
  }, [inputVars, distribution, setDistribution]);

  if (inputVars.length === 0) {
    return <></>
  }

  return (
    <Box sx={{ marginTop: "8px", paddingTop: "8px", borderRadius: "8px" }}>
      <Typography variant="h6" sx={{ fontFamily: 'inherit', fontWeight: '100', marginBottom: '16px' }}>
        Input Variable Distributions
      </Typography>
      <Box sx={{ display: "flex", overflowX: "auto" }}>
        {Object.keys(distribution).map((inputVar, index) => {
          return (
            <Box
              key={index}
              sx={(theme) => ({
                display: "flex",
                flexDirection: "column",
                flex: 1,
                maxWidth: "240px",
                padding: "8px 8px 16px",
                marginRight: "16px",
                backgroundColor: theme.palette.background.default,
                gap: "16px",
                borderRadius: "8px",
              })}>
              <Typography variant="h6" sx={{ fontSize: '1.2em' }}>
                <Chip label={inputVar} style={{ width: '100%', fontSize: '0.8em', fontWeight: '100', textTransform: 'uppercase', borderRadius: '8px', backgroundColor: `${theme.palette.primary.main}` }}></Chip>
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <InputLabel sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'start' }}>
                Type:
                <Select
                  variant="outlined"
                  size="small"
                  id={index + "selector"}
                  value={distribution[inputVar]?.distribution || ""}
                  sx={{ minWidth: 132, width: '100%' }}
                  onChange={(e) => handleDistributionChange(inputVar, e.target.value as distribution)}
                >
                  {/* TODO include info buttons about each distribution & their parameters */}
                  <MenuItem value="constant">Constant</MenuItem>
                  <MenuItem value="normal">Normal (Gaussian)</MenuItem>
                  <MenuItem value="uniform">Uniform</MenuItem>
                  <MenuItem value="log-normal" disabled={true}>LogNormal</MenuItem>
                  <MenuItem value="exponential" disabled={true}>Exponential</MenuItem>
                </Select>
              </InputLabel>
              <>
                {distribution[inputVar]?.distribution === "constant" ? (
                  <ConstantInputDistribution inputVar={inputVar} />
                ) : distribution[inputVar]?.distribution === "normal" ? (
                  <NormalInputDistribution inputVar={inputVar} />
                ) : distribution[inputVar]?.distribution === "uniform" ? (
                  <UniformInputDistribution inputVar={inputVar} />
                ) : (
                  "not found"
                )}
                {/* For v9 release, removed log-normal and exponential input distributions
                  ) : distribution[inputVar]?.distribution === "log-normal" ? (
                      <LogNormalInputDistribution inputVar={inputVar} />
                    ) : distribution[inputVar]?.distribution === "exponential" ? (
                        <ExponentialInputDistribution inputVar={inputVar} />
                */}
              </>
            </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
