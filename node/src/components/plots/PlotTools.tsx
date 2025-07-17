import { InputLabel, Typography, Select, MenuItem, TextField, styled, Slider } from "@mui/material";
import { useState } from "react";
import { FunctionJob } from "../../osparc-api-ts-client/models/FunctionJob";
import { MMUXContextType, useMMUXContext } from "../../context/MMUXContext";
import { useFunctionContext } from "../../context/FunctionContext";
import { Function } from "../../osparc-api-ts-client";

interface fullContext extends MMUXContextType {
  selectedFunction: Function | undefined;
  inputVars: string[];
  distribution: { [key: string]: InputVarSelection };
}

export const _get_unique_values = (context: fullContext) => {
  const { inputVars, allJobsList } = context;
  const uniqueValuesPerVar: { [varName: string]: Set<number> } = {};
  const jobs = allJobsList();
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

export const _filterOutConstantDataVars = (context: fullContext) => {
  // Filter out variables with only one unique value
  const uniqueValuesPerVar: { [varName: string]: Set<number> } = _get_unique_values(context)
  const newFilteredInputVars = Object.entries(uniqueValuesPerVar)
    .filter(([_value, valueSet]) => valueSet.size > 1)
    .map(([varName]) => varName);
  return newFilteredInputVars
}
export const _filterOutConstantDistributionVars = (context: fullContext) => {
  const {
    distribution,
    inputVars,
    selectedFunction
  } = context;
  return inputVars.filter(
    (i) =>
      (distribution[selectedFunction?.uid || ""][i]
        .distribution as distribution) !== "constant"
  );
}
export const filterInputVars = (context: fullContext) => {
  const { allJobsList } = context;
  // If there are no jobs, we have no information about the data distribution -- use the distribution set by the user
  if (allJobsList().length === 0) return _filterOutConstantDistributionVars(context)
  // if we have samples, then we can easily ascertain from it whether each parameter was modeled as constant or not
  else return _filterOutConstantDataVars(context)
}

interface CreateSelectProps {
  inputVars: string[];
  axis: string;
  idx?: number;
  setAxis: (value: string) => void;
}
export const CreateSelect = ({ axis, idx, setAxis }: CreateSelectProps) => {
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const context = useMMUXContext();
  // NB: could have other filtering (based on distribution === "constant")
  const filteredInputVars = filterInputVars({...context, selectedFunction, inputVars, distribution});

  return (
    <InputLabel sx={{ display: 'flex', gap: 2, alignItems: "center" }}>
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
  color: `color-mix(in srgb, ${theme.palette.primary.main} 90%, white)`,
}));

const sliderMarc = (value: number) => { return `~: ${value}` };

export const CreateSlider = ({ dist, input, otherAxis, setOtherAxis }: CreateSliderProps) => {
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const context = useMMUXContext();
  const filteredInputVars = filterInputVars({...context, selectedFunction, inputVars, distribution});
  const uniqueValuesPerVar = _get_unique_values({...context, selectedFunction, inputVars, distribution});
  let min, max, val;
  if (dist.distribution === "normal" && dist.mean !== undefined && dist.std !== undefined) {
    min = dist.mean - 2.5 * dist.std;
    max = dist.mean + 2.5 * dist.std;
    val = dist.mean
  } else if (dist.distribution === "uniform" && dist.min !== undefined && dist.max !== undefined) {
    min = dist.min;
    max = dist.max;
    val = (dist.max + dist.min) / 2
  } else {
    console.warn("Could not define max & min for variable ", input)
    min = 0
    max = 1
    val = 0.5
  }
  const [value, setValue] = useState(val || 0);

  if (!filteredInputVars.includes(input)) {
    // min = uniqueValuesPerVar[input].values().next().value * 0.99
    // max = uniqueValuesPerVar[input].values().next().value * 1.01
    const singleVal = uniqueValuesPerVar[input].values().next().value // get the first value

    if (singleVal !== undefined) {
      min = singleVal * 0.99
      max = singleVal * 1.01
    } else {
      console.warn("No values found for variable", input, "setting default min and max to 0 and 1")
      min = 0;
      max = 1;
    }
    // setValue(uniqueValuesPerVar[input])
  } // TODO add the other distributions

  const step = (max - min) / 100
  const changeOtherAxis = (e: Event, value: number) => {
    const newAxis = { ...otherAxis };
    newAxis[input] = value as number;
    console.log("new otherAxis: ", newAxis)
    setOtherAxis(newAxis);
  }

  return (
    <InputLabel
      sx={{ flex: 1, display: "flex", gap: 2, alignItems: "center", paddingTop: 2, overflow: "visible" }}
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
        }}
        onChangeCommitted={(e, newValue) => {
          changeOtherAxis(e as Event, newValue as number)
        }}
        disabled={!filteredInputVars.includes(input)}
      />
      <TextField
        value={parseFloat(value.toPrecision(3))}
        onChange={(e) => {
          setValue(parseFloat(e.target.value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const newAxis = { ...otherAxis };
            // const val = Math.max(Math.min(value, max), min)
            // setValue(val) // For now, allow user to put any arbitrary number (do not restrain to min-max range)
            newAxis[input] = value;
            setOtherAxis(newAxis);
          }
          if (e.key === "ArrowDown") {
            const newAxis = { ...otherAxis };
            const val = Math.max(min, value - step);
            setValue(val);
            newAxis[input] = val;
            setOtherAxis(newAxis);
          }
          if (e.key === "ArrowUp") {
            const newAxis = { ...otherAxis };
            const val = Math.min(max, value + step);
            setValue(val)
            newAxis[input] = val
            setOtherAxis(newAxis);
          }
        }}
        onBlur={(e) => {
          const newAxis = { ...otherAxis };
          const val = parseFloat(e.target.value);
          setValue(val);
          newAxis[input] = val;
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

// plot margings to be applied to all plots
export const plotMargins = { l: 20, r: 40, b: 30, t: 55 }