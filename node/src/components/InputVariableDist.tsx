import { Box, Chip, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useEffect } from "react";
import { useMMUXContext } from "../context/MMUXContext";

export const InputVariableDist = () => {
  const { inputVars, distribution, setDistribution } = useMMUXContext();

  const handleSetValue = (inputVar: string, type: string, value: number) => {
    const newInputVars = { ...distribution };
    if (!newInputVars[inputVar]) {
      newInputVars[inputVar] = { distribution: "normal" };
    }
    newInputVars[inputVar][type as variables] = value;
    setDistribution(newInputVars);
  }

  const InputBlock = (props: InputBlockProps) => {
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
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </InputLabel>
    );
  }

  const ConstantInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <InputBlock
        name="Value"
        value={distribution[inputVar].value ? distribution[inputVar].value : null}
        onChange={(value) => handleSetValue(inputVar, 'value', value)}
      />
    );
  }

  const NormalInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <>
        <InputBlock
          name="Mean"
          value={distribution[inputVar].mean ? distribution[inputVar].mean : null}
          onChange={(value) => handleSetValue(inputVar, 'mean', value)}
        />
        <InputBlock
          name="Standard Deviation"
          value={distribution[inputVar].std ? distribution[inputVar].std : null}
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
          value={distribution[inputVar].min ? distribution[inputVar].min : null}
          onChange={(value) => handleSetValue(inputVar, 'min', value)}
        />
        <InputBlock
          name="Max"
          value={distribution[inputVar].max ? distribution[inputVar].max : null}
          onChange={(value) => handleSetValue(inputVar, 'max', value)}
        />
      </>
    );
  }

  const LogNormalInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <>
        <InputBlock
          name="Log Location"
          value={distribution[inputVar].location ? distribution[inputVar].location : null}
          onChange={(value) => handleSetValue(inputVar, 'location', value)}
        />
        <InputBlock
          name='Log Scale'
          value={distribution[inputVar].scale ? distribution[inputVar].scale : null}
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
    <Box sx={{ marginTop: "20px", padding: "16px", borderRadius: "8px" }}>
      <Typography variant="h5" sx={{ fontFamily: 'inherit', fontWeight: '100', marginBottom: '16px' }}>
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
                padding: "16px",
                marginRight: "16px",
                backgroundColor: theme.palette.background.default,
                gap: "16px",
                borderRadius: "8px",
              })}>
              <InputLabel sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: '1.2em' }}>
                  <Chip label={inputVar} style={{ fontSize: '0.8em', fontWeight: '100', textTransform: 'uppercase' }}></Chip> :
                </Typography>
                <Select
                  variant="outlined"
                  size="small"
                  id={index + "selector"}
                  value={distribution[inputVar]?.distribution || ""}
                  sx={{ minWidth: 132 }}
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
          );
        })}
      </Box>
    </Box>
  );
};
