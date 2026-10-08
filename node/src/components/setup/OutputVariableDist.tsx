import { Box, Chip, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Add, Cancel } from "@mui/icons-material";
// import { useServiceContext } from "../../context/ServiceContext";
import Header from "../navigation/Header";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { CustomAnimatedToggle } from "../utils/CustomAnimatedToggle";
import { AddOutputModal } from "./AddOutputModal";
import { buildQoiScaleKey, minCvJobs, useAutoDetectQoiScale } from "../../utils/useAutoDetectQoiScale";
import { aggregateOutputValues } from "../../utils/functionUtils";

// 3 significant digits keeps RMSE comparisons readable without false precision.
const fmtRmse = (v: number) => String(Number(v.toPrecision(3)));

interface OutputVariableDistProps {
  /**
   * "MOGA" additionally surfaces the optimization-target controls (add/remove
   * outputs, minimize/maximize). SUMO/UQ get the same cards for EVERY output,
   * carrying only the surrogate-scale control — V12's QoI scale is meaningful
   * wherever a surrogate predicts the output, not just in MOGA (the old MOGA-only
   * mount left UQ/SUMO users with invisible auto-detection and no way to override
   * it).
   */
  serviceMode: string;
}

export function OutputVariableDist({ serviceMode }: OutputVariableDistProps) {
  const optimization = serviceMode === "MOGA";
  const {
    selectedFunction,
    inputVars,
    distribution,
    outputVars,
    outputTargets,
    setOutputTargets,
    outputLogScales,
    setOutputLogScales,
    outputLogScaleUserSet,
    setOutputLogScaleUserSet,
    qoiScaleEvidence,
  } = useFunctionContext();
  const { filteredJobList } = useJobContext();
  // const { ServiceMode } = useServiceContext();
  const [openModal, setOpenModal] = useState(false);
  const [configuredOutputs, setConfiguredOutputs] = useState(outputTargets[selectedFunction?.uid || ""] || {});
  const [localOutputLogScales, setLocalOutputLogScales] = useState<{ [varName: string]: boolean }>(
    outputLogScales[selectedFunction?.uid || ""] || {},
  );
  const theme = useTheme();
  const uid = selectedFunction?.uid || "";

  // The QoI scale is only meaningful if the user can see WHY it is what it is:
  // this view owns the toggles, so it drives auto-detection itself (not only
  // the results views). Cross-mount duplicate work is impossible — the results
  // hooks and this panel are never mounted on the same screen — and any
  // verdict already in qoiScaleEvidence for the current key short-circuits the
  // pair anyway.
  useAutoDetectQoiScale(selectedFunction ? (optimization ? Object.keys(outputTargets[uid] || {}) : outputVars) : undefined);
  const outputsByVar = useMemo(() => aggregateOutputValues(filteredJobList), [filteredJobList]);
  // Same primitives the hook hashes into its cache key, so "is this receipt
  // about the CURRENT jobs/scales?" is answerable at the card (GH-Copilot
  // #696 re-review: a stale receipt must never render as the live verdict).
  const sortedJobUids = useMemo(
    () =>
      filteredJobList
        .map(job => job.uid)
        .sort()
        .join(","),
    [filteredJobList],
  );
  const inputScaleSignature = useMemo(
    () => inputVars.map(v => (distribution[uid]?.[v]?.scale === "log" ? "1" : "0")).join(""),
    [inputVars, distribution, uid],
  );
  const minJobs = minCvJobs(inputVars.length);

  const handleSetOutputLogScale = (outputVar: string, value: boolean) => {
    setLocalOutputLogScales(prev => ({ ...prev, [outputVar]: value }));
    if (selectedFunction) {
      // MERGE with the live per-uid map: a render-time snapshot could silently
      // clobber an entry useAutoDetectQoiScale wrote for a sibling QoI while
      // this render was stale (GH-Copilot #663 audit; the lock-map setter two
      // lines below already used the functional pattern)
      setOutputLogScales(prev => ({
        ...prev,
        [selectedFunction.uid]: { ...prev[selectedFunction.uid], [outputVar]: value },
      }));
      // V27: manual toggle locks this (uid, QoI) pair so auto-detect never overrides it.
      setOutputLogScaleUserSet(prev => ({
        ...prev,
        [selectedFunction.uid]: { ...prev[selectedFunction.uid], [outputVar]: true },
      }));
    }
  };

  useEffect(() => {
    setLocalOutputLogScales(outputLogScales[selectedFunction?.uid || ""] || {});
  }, [outputLogScales, selectedFunction]);

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
      // handlesetConfiguredOutputs(Object.fromEntries(outputVars.map(v => [v, "minimize"])));
      handlesetConfiguredOutputs({});
    } else {
      handlesetConfiguredOutputs({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputTargets, outputVars, selectedFunction]);

  if (outputVars && outputVars.length === 0) {
    return <></>;
  }

  // MOGA renders the user-configured target subset; SUMO/UQ have no target concept,
  // so every output gets a scale card.
  const renderedOutputs = optimization ? Object.keys(configuredOutputs) : outputVars;

  return (
    <Box sx={{ marginTop: "8px", paddingTop: "8px", borderRadius: "8px" }}>
      <Header
        fontWeight={300}
        headerType="subTitle"
        tabTitle={optimization ? "Optimization Objectives" : "Predicted Outputs"}
        infoText={
          optimization
            ? "Optimize the output variables by minimizing or maximizing their range"
            : "Whether each output is fitted on a linear or log scale. Auto-detection runs once enough positive samples exist; toggle to override."
        }
        errorMessage={
          optimization && Object.keys(configuredOutputs).length === 0
            ? "Please select at least one output variable to optimize."
            : undefined
        }
      />
      <Box sx={{ display: "flex", overflowX: "auto" }}>
        {renderedOutputs.map(outputVar => {
          // WHY is this scale what it is: locked by manual toggle, or the
          // auto-detect CV pair's verdict (and its measured errors)?
          const locked = !!outputLogScaleUserSet[uid]?.[outputVar];
          // A stored receipt only describes reality while its key is current —
          // after a job-set or input-scale change it is stale until a fresh
          // pair commits (GH-Copilot #696 re-review).
          const stored = qoiScaleEvidence[uid]?.[outputVar];
          const evidence =
            stored && stored.key === buildQoiScaleKey(uid, outputVar, sortedJobUids, inputScaleSignature) ? stored : undefined;
          const outputs = outputsByVar[outputVar] || [];
          const hasNonPositive = outputs.some(v => v <= 0);
          const detectable = outputs.length >= minJobs && outputs.every(v => v > 0);
          return (
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
                {optimization && (
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
                )}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {optimization && (
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
                )}
                <Tooltip
                  placement="top"
                  title={
                    <Box sx={{ maxWidth: "260px" }}>
                      {evidence && (
                        <Typography component="div" variant="caption">
                          CV error · {evidence.jobs} jobs —{" "}
                          <Box component="span" sx={{ fontWeight: evidence.rmseLinear <= evidence.rmseLog ? 700 : 400 }}>
                            linear {fmtRmse(evidence.rmseLinear)}
                          </Box>
                          {" · "}
                          <Box component="span" sx={{ fontWeight: evidence.rmseLog < evidence.rmseLinear ? 700 : 400 }}>
                            log {fmtRmse(evidence.rmseLog)}
                          </Box>
                        </Typography>
                      )}
                      <Typography component="div" variant="caption">
                        {locked
                          ? "Set manually — auto-detection will not override it."
                          : evidence
                            ? "Auto-selected: lower CV error wins. Toggling locks your choice."
                            : detectable
                              ? "Comparing linear and log cross-validation errors…"
                              : outputs.length < minJobs
                                ? `Auto-detection starts once this output has ${minJobs}+ completed jobs.`
                                : "Auto-detection needs all values of this output to be positive."}
                      </Typography>
                      {hasNonPositive && (
                        <Typography component="div" variant="caption" sx={{ color: "warning.main" }}>
                          Current jobs include outputs ≤ 0 — a log fit is invalid for them and the backend will reject log
                          requests on this output.
                        </Typography>
                      )}
                    </Box>
                  }
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }} mmux-testid={`surrogate-scale-${outputVar}`}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Typography sx={{ fontSize: "0.75em", fontWeight: 300, color: theme.palette.text.secondary }}>
                        Surrogate scale
                      </Typography>
                      {(locked || evidence) && (
                        <Chip
                          label={locked ? "manual" : "auto"}
                          size="small"
                          mmux-testid={`surrogate-scale-provenance-${outputVar}`}
                          sx={{
                            height: "16px",
                            "& .MuiChip-label": { paddingLeft: "4px", paddingRight: "4px", fontSize: "0.6em" },
                          }}
                        />
                      )}
                    </Box>
                    <CustomAnimatedToggle
                      data={["linear", "log"]}
                      value={localOutputLogScales[outputVar] ? 1 : 0}
                      disabled={false}
                      onChange={value => handleSetOutputLogScale(outputVar, value === 1)}
                    />
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          );
        })}
        {optimization && Object.keys(configuredOutputs).length < outputVars.length && (
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
              aria-label="Add output variable"
              mmux-testid="add-output-var-btn"
            >
              <Add sx={{ fontSize: "2em" }} />
            </IconButton>
          </Box>
        )}
      </Box>
      {optimization && (
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
      )}
    </Box>
  );
}
