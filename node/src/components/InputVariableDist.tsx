import { Box, Chip, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import MMUXContext from "../views/MMUXContext";

interface InputBlockProps {
  name: string,
  value: number,
  onChange: (value: number) => void
}

type distribution = 'constant' | 'normal' | 'uniform' | 'log-normal' | 'exponential';
type variables = 'value' | 'mean' | 'std' | 'min' | 'max' | 'location' | 'scale';

interface VarSelection {
  distribution: distribution;
  value?: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  location?: number;
  scale?: number;
}

interface InputVarSelection {[x: string]: VarSelection}

export const InputVariableDist = () => {
  const context = useContext(MMUXContext);
  const inputVars = (context?.inputVars ?? []) as string[];
  const [inputVarSelection, setInputVarSelection] = useState<InputVarSelection>({});

  const handleSetValue = (inputVar: string, type: string, value: number) => {
    console.log("Setting values in INPUTVARS!", inputVarSelection);
    const newInputVars = {...inputVarSelection};
    if (!newInputVars[inputVar]) {
      newInputVars[inputVar] = { distribution: "normal" };
    }
    newInputVars[inputVar][type as variables] = value;
    setInputVarSelection(newInputVars);
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

  const NormalInputDistribution = ({inputVar}: {inputVar: string}) => {
    return (
      <>
        <InputBlock
          name="Mean"
          value={inputVarSelection[inputVar].mean ? inputVarSelection[inputVar].mean : 0}
          onChange={(value) => handleSetValue(inputVar, 'mean', value)}
        />
        <InputBlock
          name="Standard Deviation"
          value={inputVarSelection[inputVar].std ? inputVarSelection[inputVar].std : 0}
          onChange={(value) => handleSetValue(inputVar, 'std', value)}
        />
      </>
    );
  }

  const UniformInputDistribution = ({inputVar}: {inputVar: string}) => {
    const [mean, setMean] = useState(0.0);
    const [std, setStd] = useState(1.0);

    return (
      <>
        <InputBlock name="Mean" value={mean} onChange={setMean} />
        <InputBlock name="Standard Deviation" value={std} onChange={setStd} />
      </>
    );
  }

  const ExponentialInputDistribution = ({inputVar}: {inputVar: string}) => {
    const [mean, setMean] = useState(1.0);
    const [std, setStd] = useState(1.0);

    return (
      <>
        <InputBlock name="Mean" value={mean} onChange={setMean} />
        <InputBlock name="Standard Deviation" value={std} onChange={setStd} />
      </>
    );
  }
  const LogNormalInputDistribution = ({inputVar}: {inputVar: string}) => {
    const [mean, setMean] = useState(0.0);
    const [std, setStd] = useState(1.0);
    return (
      <>
        <InputBlock name="Mean" value={mean} onChange={setMean} />
        <InputBlock name="Standard Deviation" value={std} onChange={setStd} />
      </>
    );
  }

  const handleDistributionChange = (inputVar: string, value: distribution) => {
    const newInputVars = {...inputVarSelection};
    const newDist: VarSelection = {distribution: value};
    newInputVars[inputVar] = newDist;
    setInputVarSelection(newInputVars);
  };

  useEffect(() => {
    if (inputVars.length > 0 && Object.keys(inputVarSelection).length === 0) {
      const initialInputVars = inputVars.reduce<InputVarSelection>((acc, val) => {
        acc[val] = { distribution: "normal" };
        return acc;
      }, {} as InputVarSelection);
      setInputVarSelection(initialInputVars);
    }
  }, [inputVars, inputVarSelection]);

  if(inputVars.length === 0) {
    return <></>
  }

  return (
    <Box sx={{ marginTop: "20px", padding: "16px", borderRadius: "8px" }}>
      <Typography variant="h5" sx={{fontFamily: 'inherit', fontWeight: '100', marginBottom: '16px'}}>
        Input Variable Distributions
      </Typography>
      <Box sx={{ display: "flex", overflowX: "auto"}}>
        {inputVars.map((inputVar, index) => {
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
                <Typography variant="h6" sx={{ fontSize: '1.2em'}}>
                  <Chip label={inputVar} style={{fontSize: '0.8em', fontWeight: '100', textTransform: 'uppercase'}}></Chip> :
                </Typography>
                <Select
                  variant="outlined"
                  size="small"
                  id={index+"selector"}
                  value={inputVarSelection[inputVar]?.distribution || ""}
                  sx={{ minWidth: 132 }}
                  onChange={(e) => handleDistributionChange(inputVar, e.target.value as distribution)}
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="uniform">Uniform</MenuItem>
                  <MenuItem value="log-normal">LogNormal</MenuItem>
                  <MenuItem value="exponential">Exponential</MenuItem>
                </Select>
              </InputLabel>
              <>
                {inputVarSelection[inputVar]?.distribution === "normal" ? (
                  <NormalInputDistribution inputVar={inputVar} />
                ) : inputVarSelection[inputVar]?.distribution === "uniform" ? (
                  <UniformInputDistribution inputVar={inputVar} />
                ) : inputVarSelection[inputVar]?.distribution === "log-normal" ? (
                  <LogNormalInputDistribution inputVar={inputVar} />
                ) : inputVarSelection[inputVar]?.distribution === "exponential" ? (
                  <ExponentialInputDistribution inputVar={inputVar} />
                ) : (
                  "not found"
                )}
              </>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
