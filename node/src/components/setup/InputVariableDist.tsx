import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from "@mui/material";
import { Refresh, WarningAmber } from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServiceContext } from "../../context/ServiceContext";
import InputVariableDistDocument from "../documents/InputVariableDistDocument";
import { InputBlock } from "../utils/InputBlock";
import { CustomAnimatedToggle } from "../utils/CustomAnimatedToggle";
import CustomTooltip from "../utils/CustomTooltip";
import Header from "../navigation/Header";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { buildWarnings, computeDiagnostics, extractValuesFromJobs } from "../../utils/distributionDiagnostics";
import { computeDistributionParamsForType, pickDistributionPreset } from "../../utils/jobCollectionCsv";

interface InputDistProps {
  inputVar: string;
  distribution: InputVarSelection;
  handleSetValue: (inputVar: string, type: string, value: number) => void;
  handleRefreshField: (inputVar: string, field: Variables) => void;
}

const ConstantInputDistribution = ({ inputVar, distribution, handleSetValue, handleRefreshField }: InputDistProps) => {
  const errorNaNValue = !(distribution[inputVar].value !== undefined && !Number.isNaN(distribution[inputVar].value));
  const errorBeyondRange =
    distribution[inputVar] &&
    ((typeof distribution[inputVar].value === "number" && distribution[inputVar].value < -1e9) ||
      (typeof distribution[inputVar].value === "number" && distribution[inputVar].value > 1e9));

  let errorText = "";
  if (errorNaNValue) {
    errorText = "Empty value";
  } else if (errorBeyondRange) {
    errorText = "Out of range (-1e9, 1e9)";
  }

  const error = errorNaNValue || errorBeyondRange;

  return (
    <>
      <InputBlock
        name="Value"
        value={distribution[inputVar].value !== undefined ? distribution[inputVar].value : NaN}
        minmax={{ min: -1e9, max: 1e9 }}
        error={errorNaNValue || errorBeyondRange}
        onChange={value => handleSetValue(inputVar, "value", value as number)}
        onRefresh={() => handleRefreshField(inputVar, "value")}
      />
      {error && <Typography color="error">{errorText}</Typography>}
    </>
  );
};

const NormalInputDistribution = ({ inputVar, distribution, handleSetValue, handleRefreshField }: InputDistProps) => {
  const errorNaNMean = !(distribution[inputVar].mean !== undefined && !Number.isNaN(distribution[inputVar].mean));
  const errorNaNStd = !(distribution[inputVar].std !== undefined && !Number.isNaN(distribution[inputVar].std));
  const errorBeyondRangeMean =
    distribution[inputVar] &&
    ((typeof distribution[inputVar].mean === "number" && distribution[inputVar].mean < -1e9) ||
      (typeof distribution[inputVar].mean === "number" && distribution[inputVar].mean > 1e9));
  const errorBeyondRangeStd =
    distribution[inputVar] &&
    ((typeof distribution[inputVar].std === "number" && distribution[inputVar].std <= 0) ||
      (typeof distribution[inputVar].std === "number" && distribution[inputVar].std > 1e9));

  let errorText = "";
  if (errorNaNMean || errorNaNStd) {
    errorText = "Empty value";
  } else if (errorBeyondRangeMean) {
    errorText = "Out of range (-1e9, 1e9)";
  } else if (errorBeyondRangeStd) {
    errorText = "Out of range (>0, 1e9)";
  }

  const error = errorNaNMean || errorNaNStd || errorBeyondRangeMean || errorBeyondRangeStd;

  return (
    <>
      <InputBlock
        name="Mean"
        // TODO remove default values; just for development speed
        value={distribution[inputVar].mean !== undefined ? distribution[inputVar].mean : 0.0}
        minmax={{ min: -1e9, max: 1e9 }}
        error={errorNaNMean || errorBeyondRangeMean}
        onChange={value => handleSetValue(inputVar, "mean", value as number)}
        onRefresh={() => handleRefreshField(inputVar, "mean")}
      />
      <InputBlock
        name="Standard Deviation"
        // TODO remove default values; just for development speed
        value={distribution[inputVar].std !== undefined ? distribution[inputVar].std : 1.0}
        minmax={{ min: 0.0000000001, max: 1e9 }}
        error={errorNaNStd || errorBeyondRangeStd}
        onChange={value => handleSetValue(inputVar, "std", value as number)}
        onRefresh={() => handleRefreshField(inputVar, "std")}
      />
      {error && <Typography color="error">{errorText}</Typography>}
    </>
  );
};

const UniformInputDistribution = ({ inputVar, distribution, handleSetValue, handleRefreshField }: InputDistProps) => {
  const errorNaNMin = !(distribution[inputVar].min !== undefined && !Number.isNaN(distribution[inputVar].min));
  const errorNaNMax = !(distribution[inputVar].max !== undefined && !Number.isNaN(distribution[inputVar].max));
  const errorMinMax = !(
    distribution[inputVar] &&
    typeof distribution[inputVar].min === "number" &&
    typeof distribution[inputVar].max === "number" &&
    distribution[inputVar].min < distribution[inputVar].max
  );
  const errorBeyondRange =
    distribution[inputVar] &&
    ((typeof distribution[inputVar].min === "number" && distribution[inputVar].min < -1e9) ||
      (typeof distribution[inputVar].max === "number" && distribution[inputVar].max > 1e9));
  let errorText = "";
  if (errorNaNMin || errorNaNMax) {
    errorText = "Empty value";
  } else if (errorMinMax) {
    errorText = "Min >= Max";
  } else if (errorBeyondRange) {
    errorText = "Out of range (-1e9, 1e9)";
  }

  const error = errorNaNMin || errorNaNMax || errorMinMax || errorBeyondRange;

  return (
    <>
      <InputBlock
        name="Min"
        value={distribution[inputVar].min !== undefined ? distribution[inputVar].min : NaN}
        onChange={value => handleSetValue(inputVar, "min", value as number)}
        onRefresh={() => handleRefreshField(inputVar, "min")}
        minmax={{ min: -1e9, max: 1e9 }}
        error={errorNaNMin || errorMinMax}
      />
      <InputBlock
        name="Max"
        value={distribution[inputVar].max !== undefined ? distribution[inputVar].max : NaN}
        onChange={value => handleSetValue(inputVar, "max", value as number)}
        onRefresh={() => handleRefreshField(inputVar, "max")}
        minmax={{ min: -1e9, max: 1e9 }}
        error={errorNaNMax || errorMinMax}
      />
      {error && <Typography color="error">{errorText}</Typography>}
    </>
  );
};

// B33: transparent derived note for a log-scaled normal (log-normal). The user enters
// LINEAR mean/std; this shows what those map to so it's clear how the params are applied.
function logNormalDerivedNote(mean: number | undefined, std: number | undefined): string {
  if (typeof mean !== "number" || typeof std !== "number" || !(mean > 0)) return "";
  const variance = (std * std) / (mean * mean);
  const sigma = Math.sqrt(Math.log(1 + variance));
  const mu = Math.log(mean) - (sigma * sigma) / 2;
  const fmt = (v: number) => String(Number(v.toPrecision(3)));
  return `log-normal · median ≈ ${fmt(Math.exp(mu))}, 95% range ≈ [${fmt(Math.exp(mu - 2.5 * sigma))}, ${fmt(Math.exp(mu + 2.5 * sigma))}]`;
}

export function InputVariableDist() {
  const { selectedFunction, inputVars, distribution, setDistribution, distributionUserModified, setDistributionUserModified } =
    useFunctionContext();
  const { serviceMode } = useServiceContext();
  const { filteredJobList } = useJobContext();
  const [localDistribution, setLocalDistribution] = useState(distribution[selectedFunction?.uid || ""] || {});
  const theme = useTheme();

  // Per-variable advisory warnings (distribution mismatch, Tukey outliers, etc).
  // Recomputed when the visible job list, distribution config, or service mode changes.
  const warningsByVar = useMemo(() => {
    const result: Record<string, string[]> = {};
    inputVars.forEach(v => {
      const values = extractValuesFromJobs(filteredJobList, v, "input");
      const diag = computeDiagnostics(values);
      result[v] = buildWarnings(diag, {
        role: "input",
        serviceMode,
        scale: localDistribution[v]?.scale,
        declaredDistribution: localDistribution[v]?.distribution,
      });
    });
    return result;
  }, [inputVars, filteredJobList, serviceMode, localDistribution]);

  const handleSetLocalDistribution = useCallback(
    (newInputVars: typeof localDistribution) => {
      setLocalDistribution(newInputVars);
      if (selectedFunction) {
        const newDist = {
          ...distribution,
          [selectedFunction.uid]: newInputVars,
        };
        setDistribution(newDist);
      }
    },
    [distribution, selectedFunction, setDistribution],
  );

  // B32/V40: mark/clear the per-variable "user-modified" flag (orthogonal to `distribution`,
  // which is always the source passed to the backend). Manual edits set it true; auto
  // inference/refresh clears it.
  const setModifiedFlag = useCallback(
    (inputVar: string, modified: boolean) => {
      if (!selectedFunction) return;
      setDistributionUserModified(prev => ({
        ...prev,
        [selectedFunction.uid]: { ...(prev[selectedFunction.uid] || {}), [inputVar]: modified },
      }));
    },
    [selectedFunction, setDistributionUserModified],
  );

  const handleSetValue = (inputVar: string, type: string, value: number) => {
    const newInputVars = { ...localDistribution };
    if (!newInputVars[inputVar]) {
      newInputVars[inputVar] = {
        distribution: ["SUMO", "MOGA"].includes(serviceMode) ? "uniform" : "normal",
      };
    }
    newInputVars[inputVar][type as Variables] = value;
    // log scale is invalid for non-positive bounds; clear it if min becomes invalid
    if (type === "min" && newInputVars[inputVar].scale === "log" && !(typeof value === "number" && value > 0)) {
      newInputVars[inputVar] = { ...newInputVars[inputVar], scale: "linear" };
    }
    handleSetLocalDistribution(newInputVars);
    setModifiedFlag(inputVar, true);
  };

  const handleSetScale = (inputVar: string, scale: "linear" | "log") => {
    const newInputVars = { ...localDistribution };
    if (!newInputVars[inputVar]) return;
    newInputVars[inputVar] = { ...newInputVars[inputVar], scale };
    handleSetLocalDistribution(newInputVars);
    setModifiedFlag(inputVar, true);
  };

  const handleDistributionChange = (inputVar: string, value: Distribution) => {
    // B29: re-infer this variable's params for the newly selected type from its
    // available job data, instead of leaving them empty (⊥ just `{ distribution: value }`).
    const values = extractValuesFromJobs(filteredJobList, inputVar, "input");
    const inferredParams = computeDistributionParamsForType(values, value);
    const newInputVars = { ...localDistribution };
    newInputVars[inputVar] = { distribution: value, ...inferredParams };
    handleSetLocalDistribution(newInputVars);
    setModifiedFlag(inputVar, true);
  };

  // T25: per-field "refresh" — re-infer just this one field from data, keeping the
  // variable's current distribution type and other fields untouched.
  const handleRefreshField = (inputVar: string, field: Variables) => {
    const currentType = localDistribution[inputVar]?.distribution;
    if (!currentType) {
      return;
    }
    const values = extractValuesFromJobs(filteredJobList, inputVar, "input");
    const inferredParams = computeDistributionParamsForType(values, currentType);
    if (!inferredParams || !(field in inferredParams)) {
      return;
    }
    const newInputVars = { ...localDistribution };
    newInputVars[inputVar] = { ...newInputVars[inputVar], [field]: inferredParams[field as keyof typeof inferredParams] };
    handleSetLocalDistribution(newInputVars);
    setModifiedFlag(inputVar, false);
  };

  // T25: top-level "refresh all" — re-infer the best-fit distribution (type + params)
  // for every variable of this function from its available job data, gated behind a
  // confirmation dialog since it replaces ALL variables' current configuration.
  const [refreshAllDialogOpen, setRefreshAllDialogOpen] = useState(false);

  const handleRefreshAllDistributions = () => {
    const newInputVars = { ...localDistribution };
    inputVars.forEach(inputVar => {
      const values = extractValuesFromJobs(filteredJobList, inputVar, "input");
      if (values.length > 0) {
        newInputVars[inputVar] = pickDistributionPreset(values);
      }
    });
    handleSetLocalDistribution(newInputVars);
    // refresh-all re-infers everything → all variables become auto again
    if (selectedFunction) {
      setDistributionUserModified(prev => ({ ...prev, [selectedFunction.uid]: {} }));
    }
    setRefreshAllDialogOpen(false);
  };

  const setInitialValues = (InputVar: string, operationMode: string): VarSelection => {
    const localInputVar = InputVar.toLowerCase(); // avoid case sensitivity

    // Geometry demo
    if (operationMode === "SUMO" || operationMode === "MOGA") {
      if (["angle", "anglewidth"].includes(localInputVar)) {
        return { distribution: "uniform", min: 30, max: 300 };
      }
      if (["gap", "length", "interelectrodespacing"].includes(localInputVar)) {
        return { distribution: "uniform", min: 0.2, max: 2 };
      }
      if (["silicone_extra", "siliconeextra", "siliconepadding"].includes(localInputVar)) {
        return { distribution: "uniform", min: 0.5, max: 2.5 };
      }
      // console.debug("inputVar ", inputVar, " could not be matched");
    }

    // Tissue Properties Demo
    else if (operationMode === "UQ") {
      if (
        ["sigma_conn", "sigmaconnectivetissue"].includes(localInputVar) ||
        ["sigma_interst", "sigmainterstitial"].includes(localInputVar)
      ) {
        return { distribution: "normal", mean: 0.08, std: 0.016 };
      }
      if (["sigma_fasc_lon", "sigmafasciclelongitudinal"].includes(localInputVar)) {
        return { distribution: "normal", mean: 0.57, std: 0.114 };
      }
      if (["sigma_fasc_tra", "sigmafascicletransversal"].includes(localInputVar)) {
        return { distribution: "normal", mean: 0.16, std: 0.032 };
      }
      if (["sigma_nerve", "sigmanerve"].includes(localInputVar)) {
        return { distribution: "normal", mean: 0.34, std: 0.068 };
      }
      if (["sigma_blood", "sigmablood"].includes(localInputVar)) {
        return { distribution: "normal", mean: 0.662, std: 0.13 };
      }
      if (["sigma_saline", "sigmasaline"].includes(localInputVar)) {
        return { distribution: "normal", mean: 2, std: 0.4 };
      }
    }

    // Normal defaults for new functions
    if (operationMode === "SUMO" || operationMode === "MOGA") {
      return {
        distribution: "uniform",
        mean: NaN,
        std: NaN,
        min: NaN,
        max: NaN,
      };
    }
    if (operationMode === "UQ") {
      return {
        distribution: "normal",
        mean: NaN,
        std: NaN,
        min: NaN,
        max: NaN,
      };
    }
    console.warn("Unknown serviceMode:", operationMode, "for inputDistribution default!");
    return {
      distribution: "uniform",
      mean: NaN,
      std: NaN,
      min: NaN,
      max: NaN,
    };
  };

  useEffect(() => {
    if (distribution && selectedFunction && distribution[selectedFunction.uid]) {
      setLocalDistribution(distribution[selectedFunction.uid]);
    } else if (inputVars && inputVars.length > 0) {
      const initialInputVars = inputVars.reduce(
        (acc, val) => {
          acc[val] = setInitialValues(val, serviceMode);
          return acc;
        },
        {} as typeof localDistribution,
      );
      handleSetLocalDistribution(initialInputVars);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distribution, inputVars, selectedFunction]);

  if (inputVars && inputVars.length === 0) {
    return <></>;
  }

  return (
    <Box sx={{ marginTop: "8px", paddingTop: "8px", borderRadius: "8px" }}>
      {serviceMode === "SUMO" && (
        <Header
          fontWeight={300}
          headerType="subTitle"
          tabTitle="Parameter Ranges"
          infoText="Define the range of the parameters for which you would like to examine their impact on your Quantities of Interest"
          trailingInfoIcon
          titleAction={
            <IconButton
              size="small"
              aria-label="Refresh all parameter distributions"
              mmux-testid="refresh-all-distributions-button"
              onClick={() => setRefreshAllDialogOpen(true)}
              sx={{ marginLeft: "8px", padding: "4px" }}
            >
              <Refresh sx={{ fontSize: "18px", color: theme.palette.text.secondary }} />
            </IconButton>
          }
        />
      )}
      {serviceMode === "UQ" && (
        <Header
          fontWeight={300}
          headerType="subTitle"
          tabTitle="Parameter Distributions"
          infoText="Define probability distributions for each input parameter (assumed independent)"
          extendedInfoText={InputVariableDistDocument}
          trailingInfoIcon
          titleAction={
            <IconButton
              size="small"
              aria-label="Refresh all parameter distributions"
              mmux-testid="refresh-all-distributions-button"
              onClick={() => setRefreshAllDialogOpen(true)}
              sx={{ marginLeft: "8px", padding: "4px" }}
            >
              <Refresh sx={{ fontSize: "18px", color: theme.palette.text.secondary }} />
            </IconButton>
          }
        />
      )}
      {serviceMode === "MOGA" && (
        <Header
          fontWeight={300}
          headerType="subTitle"
          tabTitle="Parameter Ranges"
          infoText="Define the range of the parameters for which you would like to examine their impact on your Quantities of Interest"
          trailingInfoIcon
          titleAction={
            <IconButton
              size="small"
              aria-label="Refresh all parameter distributions"
              mmux-testid="refresh-all-distributions-button"
              onClick={() => setRefreshAllDialogOpen(true)}
              sx={{ marginLeft: "8px", padding: "4px" }}
            >
              <Refresh sx={{ fontSize: "18px", color: theme.palette.text.secondary }} />
            </IconButton>
          }
        />
      )}
      <Dialog
        open={refreshAllDialogOpen}
        onClose={() => setRefreshAllDialogOpen(false)}
        aria-labelledby="refresh-all-distributions-dialog-title"
        aria-describedby="refresh-all-distributions-dialog-description"
      >
        <DialogTitle id="refresh-all-distributions-dialog-title">Refresh all parameter distributions?</DialogTitle>
        <DialogContent>
          <DialogContentText id="refresh-all-distributions-dialog-description">
            This will re-infer the distribution (type, e.g. Uniform/Normal/LogNormal, and its parameter values) for{" "}
            <strong>ALL</strong> input variables of this function from their available job data, replacing their current
            configuration. This cannot be undone. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefreshAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRefreshAllDistributions} color="primary" variant="contained" autoFocus>
            Refresh all
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: "flex", overflowX: "auto" }}>
        {Object.keys(localDistribution).map((inputVar, index) => (
          <Box
            key={`inputVarBox-${inputVar}`}
            mmux-testid={`input-var-box-${index}`}
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              maxWidth: "210px",
              minWidth: "210px",
              padding: "8px",
              marginRight: "16px",
              backgroundColor: theme.palette.background.default,
              gap: "16px",
              borderRadius: "8px",
            }}
          >
            <Typography variant="h6" sx={{ fontSize: "1.2em" }}>
              <Chip
                label={inputVar}
                sx={{
                  width: "100%",
                  fontSize: "0.8em",
                  fontWeight: "100",
                  textTransform: "uppercase",
                  borderRadius: "8px",
                  backgroundColor: theme.palette.primary.main,
                }}
              />
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {["UQ"].includes(serviceMode) &&
                (() => {
                  const distEntry = localDistribution[inputVar];
                  const scaleDisabled =
                    distEntry?.distribution === "constant" ||
                    (distEntry?.distribution === "uniform" && !(typeof distEntry.min === "number" && distEntry.min > 0)) ||
                    (distEntry?.distribution === "normal" && !(typeof distEntry.mean === "number" && distEntry.mean > 0));
                  const fmt = (v: number | undefined) => (typeof v === "number" ? String(Number(v.toPrecision(3))) : "?");
                  let derivedNote = "";
                  if (distEntry?.distribution === "normal" && distEntry.scale === "log") {
                    derivedNote = logNormalDerivedNote(distEntry.mean, distEntry.std);
                  } else if (distEntry?.distribution === "uniform" && distEntry.scale === "log") {
                    derivedNote = `log-uniform in [${fmt(distEntry.min)}, ${fmt(distEntry.max)}]`;
                  }
                  const showWarning = warningsByVar[inputVar] && warningsByVar[inputVar].length > 0;
                  return (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <InputLabel sx={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "start", flex: 1 }}>
                          Distribution Form:
                          <Select
                            variant="outlined"
                            size="small"
                            id={`${index}selector`}
                            value={distEntry?.distribution || ""}
                            sx={{ minWidth: 132, width: "100%" }}
                            onChange={e => handleDistributionChange(inputVar, e.target.value as Distribution)}
                            mmux-testid={`input-var-${inputVar}-distribution-selector`}
                          >
                            <MenuItem value="constant">Constant</MenuItem>
                            <MenuItem value="normal">Normal (Gaussian)</MenuItem>
                            <MenuItem value="uniform">Uniform</MenuItem>
                          </Select>
                        </InputLabel>
                        {distEntry?.distribution && distEntry.distribution !== "constant" && (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                            <Typography sx={{ fontSize: "0.7em", color: theme.palette.text.secondary }}>Scale</Typography>
                            <CustomAnimatedToggle
                              data={["linear", "log"]}
                              value={distEntry.scale === "log" ? 1 : 0}
                              disabled={scaleDisabled}
                              onChange={value => handleSetScale(inputVar, value === 1 ? "log" : "linear")}
                            />
                          </Box>
                        )}
                        {showWarning && (
                          <CustomTooltip
                            title={
                              <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {warningsByVar[inputVar].map(msg => (
                                  <Typography key={msg} sx={{ fontSize: "0.75em" }}>
                                    {msg}
                                  </Typography>
                                ))}
                              </Box>
                            }
                            placement="top-start"
                          >
                            <Box
                              sx={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", cursor: "default" }}
                              mmux-testid={`input-var-${inputVar}-diagnostics`}
                            >
                              <WarningAmber sx={{ fontSize: "16px", color: theme.palette.warning.main }} />
                            </Box>
                          </CustomTooltip>
                        )}
                      </Box>
                      {derivedNote && (
                        <Typography sx={{ fontSize: "0.7em", fontWeight: 300, color: theme.palette.text.secondary }}>
                          {derivedNote}
                        </Typography>
                      )}
                    </Box>
                  );
                })()}
              <>
                {localDistribution[inputVar]?.distribution === "constant" && (
                  <ConstantInputDistribution
                    inputVar={inputVar}
                    distribution={localDistribution}
                    handleSetValue={handleSetValue}
                    handleRefreshField={handleRefreshField}
                  />
                )}
                {localDistribution[inputVar]?.distribution === "normal" && (
                  <NormalInputDistribution
                    inputVar={inputVar}
                    distribution={localDistribution}
                    handleSetValue={handleSetValue}
                    handleRefreshField={handleRefreshField}
                  />
                )}
                {localDistribution[inputVar]?.distribution === "uniform" && (
                  <>
                    <UniformInputDistribution
                      inputVar={inputVar}
                      distribution={localDistribution}
                      handleSetValue={handleSetValue}
                      handleRefreshField={handleRefreshField}
                    />
                    {["SUMO", "MOGA"].includes(serviceMode) && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <Typography sx={{ fontSize: "0.75em", fontWeight: 300, color: theme.palette.text.secondary }}>
                          Sampling scale
                        </Typography>
                        <CustomAnimatedToggle
                          data={["linear", "log"]}
                          value={localDistribution[inputVar]?.scale === "log" ? 1 : 0}
                          disabled={!(typeof localDistribution[inputVar].min === "number" && localDistribution[inputVar].min > 0)}
                          onChange={value => handleSetScale(inputVar, value === 1 ? "log" : "linear")}
                        />
                      </Box>
                    )}
                  </>
                )}
                {!localDistribution[inputVar]?.distribution && "not found"}
                {/* exponential input distribution stays disabled/unimplemented (out of scope, B26) */}
              </>
              {selectedFunction && distributionUserModified[selectedFunction.uid]?.[inputVar] && (
                <Chip
                  size="small"
                  label="user-modified"
                  sx={{
                    alignSelf: "start",
                    backgroundColor: theme.palette.info.main,
                    color: "#fff",
                    fontSize: "0.65em",
                    height: 18,
                  }}
                />
              )}
              {!["UQ"].includes(serviceMode) && warningsByVar[inputVar] && warningsByVar[inputVar].length > 0 && (
                <CustomTooltip
                  title={
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {warningsByVar[inputVar].map(msg => (
                        <Typography key={msg} sx={{ fontSize: "0.75em" }}>
                          {msg}
                        </Typography>
                      ))}
                    </Box>
                  }
                  placement="top-start"
                >
                  <Box
                    sx={{
                      marginTop: "4px",
                      display: "inline-flex",
                      alignItems: "center",
                      width: "fit-content",
                      cursor: "default",
                    }}
                    mmux-testid={`input-var-${inputVar}-diagnostics`}
                  >
                    <WarningAmber sx={{ fontSize: "16px", color: theme.palette.warning.main }} />
                  </Box>
                </CustomTooltip>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
