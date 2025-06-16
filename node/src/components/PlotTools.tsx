import { InputLabel, Typography, Select, MenuItem, TextField, styled, Slider } from "@mui/material";
import { useState } from "react";

interface CreateSelectProps {
  filteredInputVars: string[];
  axis: string;
  idx?: number;
  setAxis: (value: string) => void;
}

export const CreateSelect = ({axis, idx, filteredInputVars, setAxis}: CreateSelectProps) => (
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
        {filteredInputVars
          .map((key) => {
            return (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            );
          })}
      </Select>
    </InputLabel>
  );

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

export const CreateSlider = ({dist,input, otherAxis, setOtherAxis}: CreateSliderProps) => {
    const [value, setValue] = useState(otherAxis[input] || 0);
    let min, max;
    if (dist.distribution === "normal" && dist.mean && dist.std) {
      min = dist.mean - 2.5 * dist.std;
      max = dist.mean + 2.5 * dist.std;
    }
    if (dist.distribution === "uniform" && dist.min && dist.max) {
      min = dist.min;
      max = dist.max;
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
          {input}:
        </Typography>
        <CustomSlider
          aria-label="Default"
          valueLabelDisplay="auto"
          getAriaValueText={sliderMarc}
          step={0.0001}
          min={min}
          max={max}
          value={value}
          onChange={(e, newValue) => {
            setValue(newValue as number);
          }}
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
          size="small"
          sx={{ width: "120px", textAlign: "center" }}
        />
      </InputLabel>
    );
  };

export const CreateConstant = ({
    dist,
    input,
  }: {
    dist: VarSelection;
    input: string;
  }) => (
    <InputLabel sx={{ flex: 1, display: "flex", gap: 2, alignItems: "center" }}>
      <Typography
        variant="h6"
        component={"p"}
        display={"inline"}
        fontFamily={"inherit"}
        fontWeight={100}
      >
        {input + ":"} <strong>{dist.value}</strong>
      </Typography>
    </InputLabel>
  );