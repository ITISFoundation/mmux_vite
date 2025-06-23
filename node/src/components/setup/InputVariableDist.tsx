import { Box, Chip, InputLabel, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useServiceContext } from "../../context/ServiceContext";
import InputVariableDistDocument from "../documents/InputVariableDistDocument";
import { useMMUXContext } from "../../context/MMUXContext";
import { InputBlock } from "../utils/InputBlock";
import Header from "../navigation/Header";

export const InputVariableDist = () => {
  const { inputVars, distribution, setDistribution, selectedFunction } = useMMUXContext();
  const { serviceMode } = useServiceContext();
  const [localDistribution, setLocalDistribution] = useState(distribution[selectedFunction?.uid || ""] || {});
  const theme = useTheme();

  const handleSetLocalDistribution = useCallback((newInputVars: typeof localDistribution) => {
    setLocalDistribution(newInputVars);
    if (selectedFunction) {
      const newDist = { ...distribution, [selectedFunction.uid]: newInputVars };
      setDistribution(newDist);
    }
  }, [distribution, selectedFunction, setDistribution]);

  const handleSetValue = (inputVar: string, type: string, value: number) => {
    const newInputVars = { ...localDistribution };
    if (!newInputVars[inputVar]) {
      newInputVars[inputVar] = { distribution: serviceMode === 'SUMO' ? "uniform" : "normal" };
    }
    newInputVars[inputVar][type as variables] = value;
    handleSetLocalDistribution(newInputVars);
  }

  const ConstantInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <InputBlock
        name="Value"
        value={localDistribution[inputVar].value !== undefined ? localDistribution[inputVar].value : NaN}
        onChange={(value) => handleSetValue(inputVar, 'value', value as number)}
      />
    );
  }

  const NormalInputDistribution = ({ inputVar }: { inputVar: string }) => {
    return (
      <>
        <InputBlock
          name="Mean"
          // TODO remove default values; just for development speed
          value={localDistribution[inputVar].mean !== undefined ? localDistribution[inputVar].mean : 0.0}
          onChange={(value) => handleSetValue(inputVar, 'mean', value as number)}
        />
        <InputBlock
          name="Standard Deviation"
          // TODO remove default values; just for development speed
          value={localDistribution[inputVar].std !== undefined ? localDistribution[inputVar].std : 1.0}
          onChange={(value) => handleSetValue(inputVar, 'std', value as number)}
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
          onChange={(value) => handleSetValue(inputVar, 'min', value as number)}
        />
        <InputBlock
          name="Max"
          value={localDistribution[inputVar].max !== undefined ? localDistribution[inputVar].max : NaN}
          onChange={(value) => handleSetValue(inputVar, 'max', value as number)}
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
          onChange={(value) => handleSetValue(inputVar, 'location', value as number)}
        />
        <InputBlock
          name='Log Scale'
          value={localDistribution[inputVar].scale !== undefined ? localDistribution[inputVar].scale : NaN}
          onChange={(value) => handleSetValue(inputVar, 'scale', value as number)}
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
          // TODO remove default values; just for development speed
          acc[val] = { distribution: serviceMode === "SUMO" ? "uniform" : "normal", mean: 0.0, std: 1.0 };
          return acc;
        }, {} as typeof localDistribution);
        handleSetLocalDistribution(initialInputVars);
      }
    }
  }, [distribution, inputVars, selectedFunction]);

  if (inputVars.length === 0) {
    return <></>
  }

  return (
    <Box sx={{ marginTop: "8px", paddingTop: "8px", borderRadius: "8px" }}>
      {serviceMode === "SUMO" ?
        <Header headerType="subTitle" tabTitle="Parameter Ranges" infoText="Define the range of the parameters for which you would like to examine their impact on your Quantities of Interest" />
        : serviceMode === "UQ" ?
          <Header headerType="subTitle" tabTitle="Parameter Distributions" infoText="Define probability distributions for each input parameter (assumed independent)" ExtendedInfoText={InputVariableDistDocument} />
          : undefined
      }
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
                padding: "16px 16px 16px",
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {serviceMode !== "SUMO" &&
                  <InputLabel sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'start' }}>
                    Distribution Form:
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
                }
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
