import { InputLabel, Typography, Select, MenuItem, TextField, styled, Slider } from "@mui/material";
import { useState } from "react";
import { useFunctionContext } from "../../context/FunctionContext";
import { Function as OsparcFunction, FunctionJob as OsparcFunctionJob } from "../../osparc-api-ts-client";
import { JobContextType, useJobContext } from "../../context/JobContext";

interface FullContext extends JobContextType {
  selectedFunction: OsparcFunction | undefined;
  inputVars: string[];
  distribution: { [key: string]: InputVarSelection };
}

export const GetUniqueValues = (context: FullContext) => {
  const { inputVars, allJobsList } = context;
  const uniqueValuesPerVar: { [varName: string]: Set<number> } = {};
  const jobs = allJobsList();
  inputVars.forEach(varName => {
    uniqueValuesPerVar[varName] = new Set<number>();
  });
  jobs.forEach((job: OsparcFunctionJob) => {
    if (job.inputs) {
      inputVars.forEach(varName => {
        const value = job.inputs[varName];
        if (typeof value === "number") {
          uniqueValuesPerVar[varName].add(value);
        }
      });
    }
  });
  return uniqueValuesPerVar;
};

export const filterOutConstantDataVars = (context: FullContext) => {
  const { distribution, selectedFunction } = context;
  const selectedDist = distribution[selectedFunction?.uid || ""];
  // Filter out variables with only one unique value
  const uniqueValuesPerVar: { [varName: string]: Set<number> } = GetUniqueValues(context);
  const newFilteredInputVars = Object.entries(uniqueValuesPerVar)
    .filter(([_value, valueSet]) => valueSet.size > 1)
    .filter(x => selectedDist[x[0]]?.distribution !== "constant")
    .map(([varName]) => varName);
  return newFilteredInputVars;
};
export const filterOutConstantDistributionVars = (context: FullContext) => {
  const { distribution, inputVars, selectedFunction } = context;
  return inputVars.filter(i => (distribution[selectedFunction?.uid || ""][i].distribution as Distribution) !== "constant");
};
export const filterInputVars = (context: FullContext) => {
  const { allJobsList } = context;
  // If there are no jobs, we have no information about the data distribution -- use the distribution set by the user
  if (allJobsList().length === 0) return filterOutConstantDistributionVars(context);
  // if we have samples, then we can easily ascertain from it whether each parameter was modeled as constant or not
  return filterOutConstantDataVars(context);
};

interface CreateSelectProps {
  axis: string;
  idx?: number;
  setAxis: (value: string) => void;
}
export function CreateSelect({ axis, idx, setAxis }: CreateSelectProps) {
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const context = useJobContext();
  // NB: could have other filtering (based on distribution === "constant")
  const filteredInputVars = filterInputVars({ ...context, selectedFunction, inputVars, distribution });
  console.log("filteredInputVars constant checks", filteredInputVars, inputVars, distribution[selectedFunction?.uid || ""]);

  return (
    <InputLabel sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      <Typography variant="h6" component="p" fontFamily="inherit" fontWeight={100}>
        Axis {idx || ""}:
      </Typography>
      <Select
        labelId="select-key1"
        id="select-key1"
        size="small"
        defaultValue=""
        value={axis}
        onChange={e => setAxis(e.target.value)}
      >
        {inputVars.map(key => (
          <MenuItem key={key} value={key} disabled={!filteredInputVars.includes(key)}>
            {filteredInputVars.includes(key) ? key : `${key} - Constant`}
          </MenuItem>
        ))}
      </Select>
    </InputLabel>
  );
}

interface OutputSelectProps {
  values: string[];
  selected: number;
  setSelected: (value: string) => void;
}
export function OutputSelect({ values, selected, setSelected }: OutputSelectProps) {
  console.log("OutputSelect render", { values, selected });
  return (
    <Select
      labelId={`select-output-${selected}`}
      id={`select-output-${selected}`}
      size="small"
      value={values[selected]}
      onChange={e => setSelected(e.target.value)}
      sx={{ flex: 1 }}
    >
      {values.map(key => (
        <MenuItem key={key} value={key}>
          {key}
        </MenuItem>
      ))}
    </Select>
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

const sliderMarc = (value: number) => `~: ${value}`;

export function CreateSlider({ dist, input, otherAxis, setOtherAxis }: CreateSliderProps) {
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const context = useJobContext();
  const filteredInputVars = filterInputVars({ ...context, selectedFunction, inputVars, distribution });
  const uniqueValuesPerVar = GetUniqueValues({ ...context, selectedFunction, inputVars, distribution });
  let min;
  let max;
  let val;
  if (dist.distribution === "normal" && dist.mean !== undefined && dist.std !== undefined) {
    min = dist.mean - 2.5 * dist.std;
    max = dist.mean + 2.5 * dist.std;
    val = dist.mean;
  } else if (dist.distribution === "uniform" && dist.min !== undefined && dist.max !== undefined) {
    min = dist.min;
    max = dist.max;
    val = (dist.max + dist.min) / 2;
  } else {
    console.warn("Could not define max & min for variable ", input, dist);
    min = (dist.value || 0) - 1;
    max = (dist.value || 0) + 1;
    val = dist.value || 0;
  }
  const [value, setValue] = useState(val || 0);

  if (!filteredInputVars.includes(input)) {
    if (dist.distribution !== "constant") {
      const singleVal = uniqueValuesPerVar[input].values().next().value; // get the first value

      if (singleVal !== undefined) {
        min = singleVal * 0.9;
        max = singleVal * 1.1;
      } else {
        console.warn("No values found for variable", input, "setting default min and max to 0 and 1");
        min = 0;
        max = 1;
      }
    }
    // setValue(uniqueValuesPerVar[input])
  } // TODO add the other distributions

  const step = (max - min) / 100;
  const changeOtherAxis = (_e: Event, newAxisValue: number) => {
    const newAxis = { ...otherAxis };
    newAxis[input] = newAxisValue as number;
    console.log("new otherAxis: ", newAxis);
    setOtherAxis(newAxis);
  };

  return (
    <InputLabel sx={{ flex: 1, display: "flex", gap: 2, alignItems: "center", paddingTop: 2, overflow: "visible" }}>
      <Typography variant="h6" component="p" fontFamily="inherit" fontWeight={100}>
        {filteredInputVars.includes(input) ? input : `${input} - constant`}:
      </Typography>
      <CustomSlider
        aria-label="Default"
        valueLabelDisplay="auto"
        getAriaValueText={sliderMarc}
        step={step}
        min={min}
        max={max}
        value={value} // TODO could not get slider to be in the middle for those w constant values
        onChange={(_e, newValue) => {
          setValue(newValue as number);
        }}
        onChangeCommitted={(e, newValue) => {
          changeOtherAxis(e as Event, newValue as number);
        }}
        disabled={!filteredInputVars.includes(input)}
      />
      <TextField
        value={parseFloat(value.toPrecision(3))}
        onChange={e => {
          setValue(parseFloat(e.target.value));
        }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            const newAxis = { ...otherAxis };
            // const val = Math.max(Math.min(value, max), min)
            // setValue(val) // For now, allow user to put any arbitrary number (do not restrain to min-max range)
            newAxis[input] = value;
            setOtherAxis(newAxis);
          }
          if (e.key === "ArrowDown") {
            const newAxis = { ...otherAxis };
            const arrowDownVal = Math.max(min, value - step);
            setValue(arrowDownVal);
            newAxis[input] = arrowDownVal;
            setOtherAxis(newAxis);
          }
          if (e.key === "ArrowUp") {
            const newAxis = { ...otherAxis };
            const arrowUpVal = Math.min(max, value + step);
            setValue(arrowUpVal);
            newAxis[input] = arrowUpVal;
            setOtherAxis(newAxis);
          }
        }}
        onBlur={e => {
          const newAxis = { ...otherAxis };
          const Blurval = parseFloat(e.target.value);
          setValue(Blurval);
          newAxis[input] = Blurval;
          setOtherAxis(newAxis);
        }}
        type="number"
        variant="outlined"
        inputProps={{ step }}
        size="small"
        sx={{ minWidth: "110px", maxWidth: "110px", textAlign: "center" }}
      />
    </InputLabel>
  );
}

// plot margings to be applied to all plots
export const plotMargins = { l: 20, r: 40, b: 30, t: 55 };
export const plotMargins2D = { l: 60, r: 40, b: 60, t: 40 };
