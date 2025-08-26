import React from "react";
import { Box, Button, useTheme } from "@mui/material";

interface CustomAnimatedToggleProps {
  disabled: boolean;
  data: string[];
  value: number;
  onChange: (value: number) => void;
  
}

export const CustomAnimatedToggle = (props: CustomAnimatedToggleProps) => {
  const { disabled, data, onChange } = props;
  const theme = useTheme();
  const [selected, setSelected] = React.useState<number>(0);

  const handleClick = (index: number) => {
    setSelected(index);
    onChange(index);
  };

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        gap: 0,
        flex: 1,
        padding: "0px",
        backgroundColor: theme.palette.background.paper,
        borderRadius: "100px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${100 / data.length}%`,
          height: "100%",
          backgroundColor: theme.palette.primary.main,
          borderRadius: "40px",
          transition: "transform 0.3s ease",
          transform: `translateX(${100 * selected}%)`,
        }}
      />
      {data.map((inputVar, index) => {
        return (
          <Button
            key={index}
            disabled={disabled}
            disableRipple
            sx={{
              width: `${100 / data.length}%`,
              fontSize: "0.8em",
              fontWeight: "600",
              textTransform: "uppercase",
              color: theme.palette.text.primary,
              backgroundColor: "transparent",
              padding: '4px',
              minWidth: 0,
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'transparent',
              }
            }}
            onClick={() => handleClick(index)}
          >{inputVar}</Button>
        );
      })}
    </Box>
  );
};
