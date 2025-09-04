import React, { useEffect } from "react";
import { Box, Button, MenuItem, Modal, Select, Typography, useTheme } from "@mui/material";
import Header from "../navigation/Header";

interface AddOutputModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: string[];
  onChange: (value: string) => void;
}

export function AddOutputModal(props: AddOutputModalProps) {
  const { open, setOpen, data, onChange } = props;
  const theme = useTheme();

  const [selected, setSelected] = React.useState<string>(data[0] || "");

  useEffect(() => {
    setSelected(data[0] || "");
  }, [data]);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="Add output variable modal"
      aria-describedby="Add a new output variable to the function configuration"
      sx={{
        margin: "auto",
        minWidth: "350px",
        maxWidth: "350px",
        minHeight: "350px",
        maxHeight: "350px",
      }}
    >
      <Box
        sx={{
          padding: "16px",
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          margin: "auto",
          marginTop: "20%",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Header headerType="title" tabTitle="Add Output Variable" fontWeight={300} />
        <Select value={selected} onChange={e => setSelected(e.target.value)}>
          {data.map(d => (
            <MenuItem key={`output-variable-${d}`} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
        <Button onClick={() => onChange(selected)} sx={{ backgroundColor: theme.palette.primary.main, marginTop: "16px" }}>
          <Typography variant="body1" color={theme.palette.text.primary}>
            Add
          </Typography>
        </Button>
      </Box>
    </Modal>
  );
}
