import { Box, Chip, InputLabel, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import { InputBlock } from "./InputBlock";
import Header from "./Header";

export const InputVariableDist = () => {
  const { inputVars, distribution, setDistribution, selectedFunction } = useMMUXContext();
  const [localDistribution, setLocalDistribution] = useState(distribution[selectedFunction?.uid || ""] || {});
  const theme = useTheme();

  const handleSetLocalDistribution = useCallback((newInputVars: typeof localDistribution) => {
    setLocalDistribution(newInputVars);
    if(selectedFunction) {
      const newDist =  { ...distribution, [selectedFunction.uid]: newInputVars };
      setDistribution(newDist);
    }
  }, [distribution, selectedFunction, setDistribution]);

  const handleSetValue = (inputVar: string, type: string, value: number) => {
    const newInputVars = { ...localDistribution };
    if (!newInputVars[inputVar]) {
      newInputVars[inputVar] = { distribution: "normal" };
    }
    newInputVars[inputVar][type as variables] = value;
    handleSetLocalDistribution(newInputVars);
  }

  const ConstantInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <InputBlock
        name="Value"
        value={localDistribution[inputVar].value !== undefined ? localDistribution[inputVar].value : NaN}
        onChange={(value) => handleSetValue(inputVar, 'value', value)}
      />
    );
  }

  const NormalInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <>
        <InputBlock
          name="Mean"
          value={localDistribution[inputVar].mean !== undefined ? localDistribution[inputVar].mean : NaN}
          onChange={(value) => handleSetValue(inputVar, 'mean', value)}
        />
        <InputBlock
          name="Standard Deviation"
          value={localDistribution[inputVar].std !== undefined ? localDistribution[inputVar].std : NaN}
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
          value={localDistribution[inputVar].min !== undefined ? localDistribution[inputVar].min : NaN}
          onChange={(value) => handleSetValue(inputVar, 'min', value)}
        />
        <InputBlock
          name="Max"
          value={localDistribution[inputVar].max !== undefined ? localDistribution[inputVar].max : NaN}
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
          value={localDistribution[inputVar].location !== undefined ? localDistribution[inputVar].location : NaN}
          onChange={(value) => handleSetValue(inputVar, 'location', value)}
        />
        <InputBlock
          name='Log Scale'
          value={localDistribution[inputVar].scale !== undefined ? localDistribution[inputVar].scale : NaN}
          onChange={(value) => handleSetValue(inputVar, 'scale', value)}
        />
      </>
    );
  }


  const handleDistributionChange = (inputVar: string, value: distribution) => {
    const newInputVars = { ...localDistribution };
    const newDist: VarSelection = { distribution: value };
    newInputVars[inputVar] = newDist;
    handleSetLocalDistribution(newInputVars);
  };

  useEffect(() => {
    if (distribution && selectedFunction && distribution[selectedFunction.uid]) {
      setLocalDistribution(distribution[selectedFunction.uid]);
    } else {
      if (inputVars.length > 0) {
        const initialInputVars = inputVars.reduce((acc, val) => {
          acc[val] = { distribution: "normal" };
          return acc;
        }, {} as typeof localDistribution);
        handleSetLocalDistribution(initialInputVars);
      }
    }
  }, [distribution, handleSetLocalDistribution, inputVars, selectedFunction, setDistribution]);

  if (inputVars.length === 0) {
    return <></>
  }

  return (
    <Box sx={{ marginTop: "8px", paddingTop: "8px", borderRadius: "8px" }}>
      <Header headerType="subTitle" tabTitle="Input Variable Distributions" infoText="Specify the probability distribution for every input parameters. Input parameters are assumed to be stochastically independent." />
      <Box sx={{ display: "flex", overflowX: "auto" }}>
        {Object.keys(localDistribution).map((inputVar, index) => {
          return (
            <Box
              key={index}
              sx={(theme) => ({
                display: "flex",
                flexDirection: "column",
                flex: 1,
                maxWidth: "240px",
                minWidth: "240px",
                padding: "8px 8px 16px",
                marginRight: "16px",
                backgroundColor: theme.palette.background.default,
                gap: "16px",
                borderRadius: "8px",
              })}>
              <Typography variant="h6" sx={{ fontSize: '1.2em' }}>
                <Chip
                  label={inputVar}
                  sx={{
                    width: '100%',
                    fontSize: '0.8em',
                    fontWeight: '100',
                    textTransform: 'uppercase',
                    borderRadius: '8px',
                    backgroundColor: theme.palette.primary.main,
                  }}
                ></Chip>
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <InputLabel sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'start' }}>
                Type:
                <Select
                  variant="outlined"
                  size="small"
                  id={index + "selector"}
                  value={localDistribution[inputVar]?.distribution || ""}
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
                {localDistribution[inputVar]?.distribution === "constant" ? (
                  <ConstantInputDistribution inputVar={inputVar} />
                ) : localDistribution[inputVar]?.distribution === "normal" ? (
                  <NormalInputDistribution inputVar={inputVar} />
                ) : localDistribution[inputVar]?.distribution === "uniform" ? (
                  <UniformInputDistribution inputVar={inputVar} />
                ) : (
                  "not found"
                )}
                {/* For v9 release, removed log-normal and exponential input distributions
                  ) : localDistribution[inputVar]?.distribution === "log-normal" ? (
                      <LogNormalInputDistribution inputVar={inputVar} />
                    ) : localDistribution[inputVar]?.distribution === "exponential" ? (
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
