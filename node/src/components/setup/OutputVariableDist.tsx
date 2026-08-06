import { Box, Chip, IconButton, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Add, Cancel } from "@mui/icons-material";
// import { useServiceContext } from "../../context/ServiceContext";
import Header from "../navigation/Header";
import { useFunctionContext } from "../../context/FunctionContext";
import { CustomAnimatedToggle } from "../utils/CustomAnimatedToggle";
import { AddOutputModal } from "./AddOutputModal";

export function OutputVariableDist() {
  const {
    selectedFunction,
    outputVars,
    outputTargets,
    setOutputTargets,
    outputLogScales,
    setOutputLogScales,
    setOutputLogScaleUserSet,
  } = useFunctionContext();
  // const { ServiceMode } = useServiceContext();
  const [openModal, setOpenModal] = useState(false);
  const [configuredOutputs, setConfiguredOutputs] = useState(outputTargets[selectedFunction?.uid || ""] || {});
  const [localOutputLogScales, setLocalOutputLogScales] = useState<{ [varName: string]: boolean }>(
    outputLogScales[selectedFunction?.uid || ""] || {},
  );
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

  const handleSetOutputLogScale = (outputVar: string, value: boolean) => {
    const next = { ...localOutputLogScales, [outputVar]: value };
    setLocalOutputLogScales(next);
    if (selectedFunction) {
      setOutputLogScales({ ...outputLogScales, [selectedFunction.uid]: next });
      // V27: manual toggle locks this (uid, QoI) pair so auto-detect never overrides it.
      setOutputLogScaleUserSet(prev => ({
        ...prev,
        [selectedFunction.uid]: { ...prev[selectedFunction.uid], [outputVar]: true },
      }));
    }
  };

  useEffect(() => {
    if (outputTargets && selectedFunction && outputTargets[selectedFunction.uid]) {
      setConfiguredOutputs(outputTargets[selectedFunction.uid]);
    } else if (outputVars && outputVars.length > 0) {
      // handlesetConfiguredOutputs(Object.fromEntries(outputVars.map(v => [v, "minimize"])));
      handlesetConfiguredOutputs({});
    } else {
      handlesetConfiguredOutputs({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputTargets, outputVars, selectedFunction]);

  useEffect(() => {
    setLocalOutputLogScales(outputLogScales[selectedFunction?.uid || ""] || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputLogScales, selectedFunction]);

  if (outputVars && outputVars.length === 0) {
    return <></>;
  }

  return (
    <Box sx={{ marginTop: "8px", paddingTop: "8px", borderRadius: "8px" }}>
      <Header
        fontWeight={300}
        headerType="subTitle"
        tabTitle="Optimization Objectives"
        infoText="Optimize the output variables by minimizing or maximizing their range"
        errorMessage={
          Object.keys(configuredOutputs).length === 0 ? "Please select at least one output variable to optimize." : undefined
        }
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
                  display: "block",
                  fontSize: "1em",
                  lineHeight: "1.1em",
                  fontWeight: "100",
                  textTransform: "uppercase",
                  borderRadius: "8px",
                  padding: "4px",
                  backgroundColor: "transparent",
                  color: theme.palette.text.primary,
                }}
              >
                <Cancel sx={{ fontSize: "1.1em", lineHeight: "1.1em" }} />
              </IconButton>
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <Typography sx={{ fontSize: "0.75em", fontWeight: 300, color: theme.palette.text.secondary }}>
                  Surrogate scale
                </Typography>
                <CustomAnimatedToggle
                  data={["linear", "log"]}
                  value={localOutputLogScales[outputVar] ? 1 : 0}
                  disabled={false}
                  onChange={value => handleSetOutputLogScale(outputVar, value === 1)}
                />
              </Box>
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
              mmux-testid="add-output-var-btn"
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
