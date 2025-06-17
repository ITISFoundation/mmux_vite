import { InputLabel, Typography, Select, MenuItem, TextField, styled, Slider } from "@mui/material";
import { useState } from "react";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import { useMMUXContext } from "../context/MMUXContext";

export const _get_unique_values = () => {
  const { inputVars, filterSelectedJobList } = useMMUXContext();
  const uniqueValuesPerVar: { [varName: string]: Set<number> } = {};
  const jobs = filterSelectedJobList();
  inputVars.forEach((varName) => {
    uniqueValuesPerVar[varName] = new Set<number>();
  });
  jobs.forEach((job: FunctionJob) => {
    if (job.inputs) {
      inputVars.forEach((varName) => {
        const value = job.inputs[varName];
        if (typeof value === "number") {
          uniqueValuesPerVar[varName].add(value);
        }
      });
    }
  });
  return uniqueValuesPerVar
}

export const _filterOutConstantDataVars = () => {
  // Filter out variables with only one unique value
  const uniqueValuesPerVar: { [varName: string]: Set<number> } = _get_unique_values()
  const newFilteredInputVars = Object.entries(uniqueValuesPerVar)
    .filter(([_, valueSet]) => valueSet.size > 1)
    .map(([varName, _]) => varName);
  return newFilteredInputVars
}
export const _filterOutConstantDistributionVars = () => {
  const {
    inputVars,
    selectedFunction,
    distribution,
  } = useMMUXContext();
  inputVars.filter(
    (i) =>
      (distribution[selectedFunction?.uid || ""][i]
        .distribution as distribution) !== "constant"
  )
}
export const filterInputVars = () => {
  // Wrapper to quickly change btw filtering mode
  return _filterOutConstantDataVars()
}

interface CreateSelectProps {
  inputVars: string[];
  axis: string;
  idx?: number;
  setAxis: (value: string) => void;
}
export const CreateSelect = ({ axis, idx, inputVars, setAxis }: CreateSelectProps) => {


  // NB: could have other filtering (based on distribution === "constant")
  const filteredInputVars = filterInputVars()

  return (
    <InputLabel sx={{ flex: 1, display: "flex", gap: 2, alignItems: "center" }}>
      <Typography
        variant="h6"
        component={"p"}
        fontFamily={"inherit"}
        fontWeight={100}
      >
        Axis {idx ? idx : ""}:
      </Typography>
      <Select
        labelId="select-key1"
        id="select-key1"
        size="small"
        defaultValue={""}
        value={axis}
        onChange={(e) => setAxis(e.target.value)}
      >
        {inputVars
          .map((key) => {
            return (
              <MenuItem key={key} value={key} disabled={!filteredInputVars.includes(key)}>
                {filteredInputVars.includes(key) ? key : key + " - Constant"}
              </MenuItem>
            );
          })}
      </Select>
    </InputLabel>
  );
}

interface CreateSliderProps {
  dist: VarSelection;
  input: string;
  otherAxis: Record<string, number>;
  setOtherAxis: (value: Record<string, number>) => void;
}

const CustomSlider = styled(Slider)(({ theme }) => ({
  color: `color-mix(in srgb, ${theme.palette.primary.main} 70%, white)`,
}));

const sliderMarc = (value: number) => `X: ${value}`;

export const CreateSlider = ({ dist, input, otherAxis, setOtherAxis }: CreateSliderProps) => {
  const [value, setValue] = useState(otherAxis[input] || 0);
  const filteredInputVars = filterInputVars()
  const uniqueValuesPerVar = _get_unique_values()
  let min, max;
  if (dist.distribution === "normal" && dist.mean !== undefined && dist.std !== undefined) {
    min = dist.mean - 2.5 * dist.std;
    max = dist.mean + 2.5 * dist.std;
  } else if (dist.distribution === "uniform" && dist.min !== undefined && dist.max !== undefined) {
    min = dist.min;
    max = dist.max;
  } else {
    console.log("Could not define max & min for variable ", input)
    min = 0
    max = 1
  }
  if (!filteredInputVars.includes(input)) {
    // min = uniqueValuesPerVar[input].values().next().value * 0.99
    // max = uniqueValuesPerVar[input].values().next().value * 1.01
    min = 0
    max = 0
    // setValue(uniqueValuesPerVar[input])
  } // TODO add the other distributions

  console.log("var", input, "min & max: ", min, max)
  console.log(uniqueValuesPerVar)
  const step = (max - min) / 500
  const changeOtherAxis = (e: Event, value: number) => {
    const newAxis = { ...otherAxis };
    newAxis[input] = value as number;
    console.log("new otherAxis: ", newAxis)
    setOtherAxis(newAxis);
  }
  return (
    <InputLabel
      sx={{ flex: 1, display: "flex", gap: 2, alignItems: "center" }}
    >
      <Typography
        variant="h6"
        component={"p"}
        fontFamily={"inherit"}
        fontWeight={100}
      >
        {filteredInputVars.includes(input) ? input : input + " - constant"}:
      </Typography>
      <CustomSlider
        aria-label="Default"
        valueLabelDisplay="auto"
        getAriaValueText={sliderMarc}
        step={step}
        min={min}
        max={max}
        value={value} // TODO could not get slider to be in the middle for those w constant values
        onChange={(e, newValue) => {
          setValue(newValue as number);
          changeOtherAxis(e, newValue as number) // NEW: upload plot for EVERY movement of slider
        }}
        onChangeCommitted={(e, newValue) => {
          changeOtherAxis(e as Event, newValue as number)
        }}
        disabled={!filteredInputVars.includes(input)}
      />
      <TextField
        value={value}
        onChange={(e) => {
          setValue(parseFloat(e.target.value));
        }}
        onBlur={(e) => {
          const newAxis = { ...otherAxis };
          newAxis[input] = parseFloat(e.target.value);
          setOtherAxis(newAxis);
        }}
        type="number"
        variant="outlined"
        inputProps={{ step: step }}
        size="small"
        sx={{ width: "120px", textAlign: "center" }}
      />
    </InputLabel>
  );
};