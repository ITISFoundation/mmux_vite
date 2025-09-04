import { Box, Chip, IconButton, InputLabel, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Add, Delete } from "@mui/icons-material";
// import { useServiceContext } from "../../context/ServiceContext";
import Header from "../navigation/Header";
import { useFunctionContext } from "../../context/FunctionContext";
import { CustomAnimatedToggle } from "../utils/CustomAnimatedToggle";
import { AddOutputModal } from "./AddOutputModal";

export function OutputVariableDist() {
  const { selectedFunction, outputVars, outputTargets: outputTargets, setOutputTargets: setOutputTargets } = useFunctionContext();
  // const { ServiceMode } = useServiceContext();
  const [openModal, setOpenModal] = useState(false);
  const [configuredOutputs, setConfiguredOutputs] = useState(outputTargets[selectedFunction?.uid || ""] || {});
  const theme = useTheme();

  const handlesetConfiguredOutputs = useCallback(
    (newOutputVars: typeof configuredOutputs) => {
      setConfiguredOutputs(newOutputVars);
      if (selectedFunction) {
        const newDist = {
          ...outputTargets,
          [selectedFunction.uid]: newOutputVars,
        };
        setOutputTargets(newDist);
      }
    },
    [outputTargets, selectedFunction, setOutputTargets],
  );

  useEffect(() => {
    if (outputTargets && selectedFunction && outputTargets[selectedFunction.uid]) {
      setConfiguredOutputs(outputTargets[selectedFunction.uid]);
    } else if (outputVars && outputVars.length > 0) {
      handlesetConfiguredOutputs(Object.fromEntries(outputVars.map(v => [v, "minimize"])));
    } else {
      handlesetConfiguredOutputs({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputTargets, outputVars, selectedFunction]);

  if (outputVars && outputVars.length === 0) {
    return <></>;
  }

  return (
    <Box sx={{ marginTop: "8px", paddingTop: "8px", borderRadius: "8px" }}>
      <Header
        fontWeight={300}
        headerType="subTitle"
        tabTitle="Output Optimization"
        infoText="Optimize the output variables by minimizing or maximizing their range"
      />
      <Box sx={{ display: "flex", overflowX: "auto" }}>
        {Object.keys(configuredOutputs).map(outputVar => (
          <Box
            key={`output-var-${outputVar}`}
            sx={{
              display: "flex",
              position: "relative",
              flexDirection: "column",
              flex: 1,
              maxWidth: "240px",
              minWidth: "240px",
              padding: "8px",
              marginRight: "16px",
              backgroundColor: theme.palette.background.default,
              gap: "16px",
              borderRadius: "8px",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: "1.2em",
                display: "flex",
                gap: "4px",
                "&:hover": {
                  "& .MuiButtonBase-root": {
                    display: "block",
                    backgroundColor: "transparent",
                  },
                },
              }}
            >
              <Chip
                label={outputVar}
                sx={{
                  width: "100%",
                  fontSize: "0.8em",
                  fontWeight: "100",
                  textTransform: "uppercase",
                  borderRadius: "8px",
                  backgroundColor: theme.palette.primary.main,
                }}
              />
              <IconButton
                aria-label="remove"
                onClick={() => {
                  const newOutputs = { ...configuredOutputs };
                  delete newOutputs[outputVar];
                  handlesetConfiguredOutputs(newOutputs);
                }}
                sx={{
                  position: "absolute",
                  zIndex: 10,
                  right: "8px",
                  display: "none",
                  fontSize: "0.8em",
                  fontWeight: "100",
                  textTransform: "uppercase",
                  borderRadius: "8px",
                  padding: "4px",
                  backgroundColor: "transparent",
                  "&:hover": {
                    display: "block",
                    backgroundColor: "transparent",
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <Delete />
              </IconButton>
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <InputLabel
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  alignItems: "start",
                }}
              >
                Optimization Target:
              </InputLabel>
              <CustomAnimatedToggle
                data={["minimize", "maximize"]}
                value={configuredOutputs[outputVar] === "minimize" ? 0 : 1}
                disabled={false}
                onChange={value => {
                  handlesetConfiguredOutputs({
                    ...configuredOutputs,
                    [outputVar]: value === 0 ? "minimize" : "maximize",
                  });
                }}
              />
            </Box>
          </Box>
        ))}
        {Object.keys(configuredOutputs).length < outputVars.length && (
          <Box
            key="add-output"
            sx={{
              display: "block",
              maxWidth: "210px",
              minWidth: "210px",
              padding: "8px",
              marginRight: "16px",
              backgroundColor: theme.palette.background.default,
              gap: "16px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <IconButton
              sx={{
                width: "100px",
                height: "100px",
                padding: 0,
                justifySelf: "center",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "transparent",
                },
              }}
              disableRipple
              onClick={() => setOpenModal(!openModal)}
            >
              <Add sx={{ fontSize: "2em" }} />
            </IconButton>
          </Box>
        )}
      </Box>
      <AddOutputModal
        open={openModal}
        setOpen={setOpenModal}
        data={outputVars.filter(v => !(v in configuredOutputs))}
        onChange={value => {
          // Handle the change event
          handlesetConfiguredOutputs({
            ...configuredOutputs,
            [value]: "minimize",
          });
          setOpenModal(false);
        }}
      />
    </Box>
  );
}
