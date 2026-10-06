import { Box, Button, Collapse, TextField, ToggleButton, ToggleButtonGroup, Typography, useTheme } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useGuardedAsyncEffect } from "../../hooks/useGuardedAsyncEffect";
import Plot from "react-plotly.js";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import {
  logColorbarTicks,
  logDisplayValue,
  logErrorDeltas,
  sobolLinearRange,
  sobolLogRange,
  toLogSafe,
  type ScaleType,
} from "../../utils/plotScale";
import { buildSobolHeatmapData, fetchSobolIndices, initialSobolDomain } from "../../utils/sobolIndices";
import { getErrorMessage } from "../../utils/httpError";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";

export type SobolViewMode = "first-order" | "total-order" | "second-order";

type SobolIndicesPlotProps = {
  viewMode: SobolViewMode;
  scaleType: ScaleType;
};

type SobolControlsProps = {
  viewMode: SobolViewMode;
  scaleType: ScaleType;
  onViewModeChange: (_event: React.MouseEvent<HTMLElement>, newMode: SobolViewMode | null) => void;
  onScaleTypeChange: (_event: React.MouseEvent<HTMLElement>, newScale: ScaleType | null) => void;
};

export function SobolControls({ viewMode, scaleType, onViewModeChange, onScaleTypeChange }: SobolControlsProps) {
  return (
    <Box display="flex" gap={1}>
      <ToggleButtonGroup value={viewMode} exclusive onChange={onViewModeChange} size="small" mmux-testid="sobol-view-toggle">
        <ToggleButton value="first-order" sx={{ textTransform: "none" }} mmux-testid="sobol-toggle-first">
          First order
        </ToggleButton>
        <ToggleButton value="second-order" sx={{ textTransform: "none" }} mmux-testid="sobol-toggle-second">
          Second order
        </ToggleButton>
        <ToggleButton value="total-order" sx={{ textTransform: "none" }} mmux-testid="sobol-toggle-total">
          Total order
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup value={scaleType} exclusive onChange={onScaleTypeChange} size="small" mmux-testid="sobol-scale-toggle">
        <ToggleButton value="linear" sx={{ textTransform: "none" }} mmux-testid="sobol-scale-linear">
          Linear
        </ToggleButton>
        <ToggleButton value="log" sx={{ textTransform: "none" }} mmux-testid="sobol-scale-log">
          Log
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

type SobolDomainMode = "range" | "pin";

/** Editable draft row per input variable; empty strings mean "unlisted"
 * (backend auto-infers the observed box, V26dd fallback). */
export type SobolDomainDraftRow = { mode: SobolDomainMode; min: string; max: string; pin: string };
export type SobolDomainDraft = { [inputVar: string]: SobolDomainDraftRow };

export type SobolDomainDraftResult = { error: string } | { domains: SobolDomainMap; fixed: SobolFixedMap };

const toNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

/** Seed the editable draft from the initialSobolDomain mapping. */
export function seedSobolDomainDraft(
  inputVars: string[],
  seed: { domains: SobolDomainMap; fixed: SobolFixedMap },
): SobolDomainDraft {
  const draft: SobolDomainDraft = {};
  for (const inputVar of inputVars) {
    const box = seed.domains[inputVar];
    const pin = seed.fixed[inputVar];
    if (box) {
      draft[inputVar] = { mode: "range", min: String(box.minimum), max: String(box.maximum), pin: "" };
    } else if (pin !== undefined) {
      draft[inputVar] = { mode: "pin", min: "", max: "", pin: String(pin) };
    } else {
      draft[inputVar] = { mode: "range", min: "", max: "", pin: "" };
    }
  }
  return draft;
}

/** Validate the draft into the request maps; ⊥ half-filled ranges, ⊥
 * non-numeric values and ⊥ inverted/degenerate boxes (min >= max). Fully
 * blank rows are omitted (auto-infer), mirroring the backend's partial shape. */
export function parseSobolDomainDraft(inputVars: string[], draft: SobolDomainDraft): SobolDomainDraftResult {
  const domains: SobolDomainMap = {};
  const fixed: SobolFixedMap = {};
  for (const inputVar of inputVars) {
    const row = draft[inputVar] ?? { mode: "range" as SobolDomainMode, min: "", max: "", pin: "" };
    if (row.mode === "range") {
      const min = toNumber(row.min);
      const max = toNumber(row.max);
      if (min === undefined && max === undefined) {
        continue;
      }
      if (min === undefined || max === undefined) {
        return { error: `${inputVar}: a range needs both bounds (or leave both blank)` };
      }
      if (Number.isNaN(min) || Number.isNaN(max)) {
        return { error: `${inputVar}: bounds must be numbers` };
      }
      if (!(max > min)) {
        return { error: `${inputVar}: maximum must exceed minimum` };
      }
      domains[inputVar] = { minimum: min, maximum: max };
    } else {
      const pin = toNumber(row.pin);
      if (pin === undefined) {
        continue;
      }
      if (Number.isNaN(pin)) {
        return { error: `${inputVar}: pinned value must be a number` };
      }
      fixed[inputVar] = pin;
    }
  }
  return { domains, fixed };
}

export default function SobolIndicesPlot({ viewMode, scaleType }: SobolIndicesPlotProps) {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputLogScales } = useFunctionContext();
  const { uqSettings, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [sobolData, setSobolData] = useState<SobolIndicesResponse | null>(null);
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [computing, setComputing] = useState(false);

  // --- bounds editor state (V26dd domain vocabulary + a9 pins) --------------
  // Seeded from the UQ selections (uniform -> box, normal -> mean +/- 3 sigma,
  // constant -> pin); every variable starts blank when no selection exists
  // (backend auto-infers). Edits only reach the request via "Recompute".
  const domainSeed = useMemo(
    () => initialSobolDomain(inputVars, distribution[selectedFunction?.uid || ""]),
    [inputVars, distribution, selectedFunction],
  );
  const [domainDraft, setDomainDraft] = useState<SobolDomainDraft>(() => seedSobolDomainDraft(inputVars, domainSeed));
  const [appliedDomain, setAppliedDomain] = useState<{ domains: SobolDomainMap; fixed: SobolFixedMap }>(domainSeed);
  const [domainError, setDomainError] = useState<string>();
  const [domainOpen, setDomainOpen] = useState(false);

  useEffect(() => {
    setDomainDraft(seedSobolDomainDraft(inputVars, domainSeed));
    setAppliedDomain(domainSeed);
    setDomainError(undefined);
  }, [domainSeed, inputVars]);

  const parsedDraft = useMemo(() => parseSobolDomainDraft(inputVars, domainDraft), [inputVars, domainDraft]);
  const draftError = "error" in parsedDraft ? parsedDraft.error : undefined;
  const canApplyDomain =
    !("error" in parsedDraft) &&
    JSON.stringify([parsedDraft.domains, parsedDraft.fixed]) !== JSON.stringify([appliedDomain.domains, appliedDomain.fixed]);

  const handleApplyDomain = () => {
    if ("error" in parsedDraft) {
      setDomainError(parsedDraft.error);
      return;
    }
    setDomainError(undefined);
    setAppliedDomain({ domains: parsedDraft.domains, fixed: parsedDraft.fixed });
  };

  // The header describes what the DISPLAYED computation actually used — the
  // applied domain, never the in-progress draft (GH-Copilot #664: a draft
  // summary would advertise settings that were never computed with).
  const domainSummary = useMemo(() => {
    const boxed = Object.keys(appliedDomain.domains).length;
    const pinned = Object.keys(appliedDomain.fixed).length;
    return `${boxed} boxed · ${pinned} pinned · ${inputVars.length - boxed - pinned} auto-inferred`;
  }, [appliedDomain, inputVars]);

  // Per-variable log-scale flags (node SPEC V12), see UncertainUQ for the pattern.
  const inputLogScales = useMemo(
    () =>
      inputVars.reduce(
        (acc: { [key: string]: boolean }, key) => {
          acc[key] = distribution[selectedFunction?.uid || ""]?.[key]?.scale === "log";
          return acc;
        },
        {} as { [key: string]: boolean },
      ),
    [inputVars, distribution, selectedFunction],
  );
  const outputLogScaleForQoi = selectedQoI ? Boolean(outputLogScales[selectedFunction?.uid || ""]?.[selectedQoI]) : false;

  useGuardedAsyncEffect(
    async isStale => {
      setSobolData(null);
      setPlotData([]);
      setErrorMessage(undefined);
      setComputing(true);
      if (filteredJobList.length === 0 || !selectedQoI) {
        console.warn("No jobs selected for Sobol' indices computation.");
        setComputing(false);
        return;
      }
      try {
        const data = await fetchSobolIndices({
          inputVars,
          output: selectedQoI,
          domains: appliedDomain.domains,
          fixed: appliedDomain.fixed,
          inputLogScales,
          outputLogScales: selectedQoI ? { [selectedQoI]: outputLogScaleForQoi } : {},
          functionJobs: filteredJobList,
          // #664 contract: distributions/numSamples are gone (sample count is
          // fixed inside itis_sumo.api, V36); the seed stays the persisted one.
          seed: uqSettings[selectedFunction?.uid || ""]?.seed || 0,
        });
        if (isStale()) return;
        setSobolData(data);
        setErrorMessage(undefined);
        setComputing(false);
      } catch (error) {
        if (isStale()) return;
        console.warn("Error computing Sobol' indices:", error);
        setComputing(false);
        setSobolData(null);
        setErrorMessage(getErrorMessage(error));
      }
    },
    // #664 deps: appliedDomain is the "Recompute" trigger; scales ride the union
    [
      filteredJobList,
      selectedQoI,
      uqSettings,
      inputVars,
      distribution,
      selectedFunction,
      appliedDomain,
      inputLogScales,
      outputLogScaleForQoi,
    ],
  );

  useEffect(() => {
    if (!sobolData) {
      setPlotData([]);
      return;
    }
    const { sobol, sobolSecondOrder } = sobolData;

    if (viewMode === "first-order") {
      const rawValues = inputVars.map(v => sobol[v]?.main ?? 0);
      const rawCiLow = inputVars.map(v => sobol[v]?.mainCiLow ?? sobol[v]?.main ?? 0);
      const rawCiHigh = inputVars.map(v => sobol[v]?.mainCiHigh ?? sobol[v]?.main ?? 0);
      const mainValues = scaleType === "log" ? rawValues.map(logDisplayValue) : rawValues;
      const ciDeltas = inputVars.map((_, i) =>
        scaleType === "log"
          ? logErrorDeltas(rawValues[i], rawCiLow[i], rawCiHigh[i])
          : [Math.max(0, rawCiHigh[i] - rawValues[i]), Math.max(0, rawValues[i] - rawCiLow[i])],
      );
      setPlotData([
        {
          x: inputVars,
          y: mainValues,
          customdata: inputVars.map((_, i) => [rawValues[i], rawCiLow[i], rawCiHigh[i]]),
          type: "bar",
          width: 0.45,
          name: "First order",
          marker: { color: theme.palette.primary.main },
          error_y: {
            type: "data",
            symmetric: false,
            array: ciDeltas.map(([high]) => high),
            arrayminus: ciDeltas.map(([, low]) => low),
          },
          hovertemplate: "%{x}<br>Index: %{customdata[0]:.4f}<br>CI: %{customdata[1]:.4f} - %{customdata[2]:.4f}<extra></extra>",
        },
      ]);
    } else if (viewMode === "total-order") {
      const rawValues = inputVars.map(v => sobol[v]?.total ?? 0);
      const rawCiLow = inputVars.map(v => sobol[v]?.totalCiLow ?? sobol[v]?.total ?? 0);
      const rawCiHigh = inputVars.map(v => sobol[v]?.totalCiHigh ?? sobol[v]?.total ?? 0);
      const totalValues = scaleType === "log" ? rawValues.map(logDisplayValue) : rawValues;
      const ciDeltas = inputVars.map((_, i) =>
        scaleType === "log"
          ? logErrorDeltas(rawValues[i], rawCiLow[i], rawCiHigh[i])
          : [Math.max(0, rawCiHigh[i] - rawValues[i]), Math.max(0, rawValues[i] - rawCiLow[i])],
      );
      setPlotData([
        {
          x: inputVars,
          y: totalValues,
          customdata: inputVars.map((_, i) => [rawValues[i], rawCiLow[i], rawCiHigh[i]]),
          type: "bar",
          width: 0.45,
          name: "Total order",
          marker: { color: theme.palette.secondary.main },
          error_y: {
            type: "data",
            symmetric: false,
            array: ciDeltas.map(([high]) => high),
            arrayminus: ciDeltas.map(([, low]) => low),
          },
          hovertemplate: "%{x}<br>Index: %{customdata[0]:.4f}<br>CI: %{customdata[1]:.4f} - %{customdata[2]:.4f}<extra></extra>",
        },
      ]);
    } else {
      // second-order heatmap: log scale applies to the color axis, not a value axis
      const heatmap = buildSobolHeatmapData(sobol, sobolSecondOrder, inputVars);
      if (scaleType === "log") {
        const z = (heatmap.z as number[][]).map(row => row.map(toLogSafe));
        setPlotData([
          {
            ...heatmap,
            z,
            customdata: heatmap.z as number[][],
            hovertemplate: "%{x} ↔ %{y}: %{customdata:.4f}<extra></extra>",
            zmin: sobolLogRange[0],
            zmax: sobolLogRange[1],
            // z is in log10 space → back-transform the colorbar labels so it does
            // not report exponents (-2/-1/0) as if they were the indices (PR #647 review)
            colorbar: { ...heatmap.colorbar, ...logColorbarTicks() },
          } as Plotly.Data,
        ]);
      } else {
        setPlotData([{ ...heatmap, zmin: sobolLinearRange[0], zmax: sobolLinearRange[1] } as Plotly.Data]);
      }
    }
  }, [sobolData, viewMode, scaleType, inputVars, theme.palette.primary.main, theme.palette.secondary.main]);

  const isHeatmap = viewMode === "second-order";
  const layout = isHeatmap
    ? {
        title: { text: "Sobol' Indices" },
        xaxis: { title: { text: "Variable" }, side: "bottom" as const },
        yaxis: { title: { text: "Variable" }, autorange: "reversed" as const },
        plot_bgcolor: `${theme.palette.background.default}`,
        paper_bgcolor: `${theme.palette.background.default}`,
        font: { color: `${theme.palette.text.primary}` },
      }
    : {
        title: { text: "Sobol' Indices" },
        xaxis: { title: { text: "Input variable" } },
        yaxis: {
          title: { text: "Sobol' index" },
          type: scaleType,
          range: scaleType === "log" ? sobolLogRange : sobolLinearRange,
        },
        barmode: "group" as const,
        plot_bgcolor: `${theme.palette.background.default}`,
        paper_bgcolor: `${theme.palette.background.default}`,
        font: { color: `${theme.palette.text.primary}` },
      };
  const plotStyle = {
    width: "100%",
    height: 400,
    borderRadius: "8px",
    overflow: "hidden",
  };

  const setDraftRow = (inputVar: string, patch: Partial<SobolDomainDraftRow>) =>
    setDomainDraft(draft => ({
      ...draft,
      [inputVar]: { ...draft[inputVar], mode: draft[inputVar]?.mode ?? "range", ...patch },
    }));

  return (
    <Box display="flex" flexDirection="column" gap={1} width="100%">
      <Box display="flex" flexDirection="column" gap={1} mmux-testid="sobol-domain-panel">
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Button
            size="small"
            variant="outlined"
            sx={{ textTransform: "none" }}
            onClick={() => setDomainOpen(open => !open)}
            mmux-testid="sobol-domain-toggle"
          >
            {domainOpen ? "Hide" : "Edit"} sampling domain
          </Button>
          <Typography variant="body2" color="text.secondary" mmux-testid="sobol-domain-summary">
            {domainSummary}
            {(canApplyDomain || draftError) && " · unapplied edits"}
          </Typography>
        </Box>
        <Collapse in={domainOpen}>
          <Box display="flex" flexDirection="column" gap={1} pb={1}>
            {inputVars.map(inputVar => {
              const row = domainDraft[inputVar] ?? { mode: "range" as SobolDomainMode, min: "", max: "", pin: "" };
              return (
                <Box
                  key={inputVar}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  flexWrap="wrap"
                  mmux-testid={`sobol-domain-row-${inputVar}`}
                >
                  <Typography sx={{ minWidth: 120, fontWeight: 600 }} noWrap>
                    {inputVar}
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={row.mode}
                    onChange={(_event, mode) => mode && setDraftRow(inputVar, { mode: mode as SobolDomainMode })}
                    mmux-testid={`sobol-domain-mode-${inputVar}`}
                  >
                    <ToggleButton value="range" sx={{ textTransform: "none" }}>
                      Range
                    </ToggleButton>
                    <ToggleButton value="pin" sx={{ textTransform: "none" }}>
                      Pin
                    </ToggleButton>
                  </ToggleButtonGroup>
                  {row.mode === "range" ? (
                    <>
                      <TextField
                        size="small"
                        label="min"
                        value={row.min}
                        onChange={event => setDraftRow(inputVar, { min: event.target.value })}
                        sx={{ width: 120 }}
                        mmux-testid={`sobol-domain-min-${inputVar}`}
                      />
                      <TextField
                        size="small"
                        label="max"
                        value={row.max}
                        onChange={event => setDraftRow(inputVar, { max: event.target.value })}
                        sx={{ width: 120 }}
                        mmux-testid={`sobol-domain-max-${inputVar}`}
                      />
                    </>
                  ) : (
                    <TextField
                      size="small"
                      label="pinned value"
                      value={row.pin}
                      onChange={event => setDraftRow(inputVar, { pin: event.target.value })}
                      sx={{ width: 150 }}
                      mmux-testid={`sobol-domain-pin-${inputVar}`}
                    />
                  )}
                </Box>
              );
            })}
            {(domainError ?? draftError) && (
              <Typography variant="body2" color="error" mmux-testid="sobol-domain-error">
                {domainError ?? draftError}
              </Typography>
            )}
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                variant="contained"
                sx={{ textTransform: "none" }}
                disabled={!canApplyDomain}
                onClick={handleApplyDomain}
                mmux-testid="sobol-domain-apply"
              >
                Recompute
              </Button>
              <Typography variant="caption" color="text.secondary">
                Blank rows fall back to the observed range; Pin holds a factor constant.
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>
      {computing && <CalculatingWarning height={plotStyle.height} dontShowText={plotData.length !== 0} />}
      {!computing && plotData.length === 0 && !sobolData && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={plotStyle.height}
          errorMessage={errorMessage}
          numInputVars={inputVars.length}
        />
      )}
      {!computing && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}
    </Box>
  );
}
