import { Box, Chip, InputLabel, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useServiceContext } from "../../context/ServiceContext";
import InputVariableDistDocument from "../documents/InputVariableDistDocument";
import { InputBlock } from "../utils/InputBlock";
import Header from "../navigation/Header";
import { useFunctionContext } from "../../context/FunctionContext";

interface InputDistProps {
  inputVar: string;
  distribution: InputVarSelection;
  handleSetValue: (inputVar: string, type: string, value: number) => void;
}

const ConstantInputDistribution = ({ inputVar, distribution, handleSetValue }: InputDistProps) => (
  <InputBlock
    name="Value"
    value={distribution[inputVar].value !== undefined ? distribution[inputVar].value : NaN}
    onChange={value => handleSetValue(inputVar, "value", value as number)}
  />
);

const NormalInputDistribution = ({ inputVar, distribution, handleSetValue }: InputDistProps) => (
  <>
    <InputBlock
      name="Mean"
      // TODO remove default values; just for development speed
      value={distribution[inputVar].mean !== undefined ? distribution[inputVar].mean : 0.0}
      onChange={value => handleSetValue(inputVar, "mean", value as number)}
    />
    <InputBlock
      name="Standard Deviation"
      // TODO remove default values; just for development speed
      value={distribution[inputVar].std !== undefined ? distribution[inputVar].std : 1.0}
      onChange={value => handleSetValue(inputVar, "std", value as number)}
    />
  </>
);

const UniformInputDistribution = ({ inputVar, distribution, handleSetValue }: InputDistProps) => (
  <>
    <InputBlock
      name="Min"
      value={distribution[inputVar].min !== undefined ? distribution[inputVar].min : NaN}
      onChange={value => handleSetValue(inputVar, "min", value as number)}
      error={
        !!(
          distribution[inputVar].min !== undefined &&
          distribution[inputVar].max !== undefined &&
          distribution[inputVar].min > distribution[inputVar].max
        )
      }
    />
    <InputBlock
      name="Max"
      value={distribution[inputVar].max !== undefined ? distribution[inputVar].max : NaN}
      onChange={value => handleSetValue(inputVar, "max", value as number)}
      error={
        !!(
          distribution[inputVar].min !== undefined &&
          distribution[inputVar].max !== undefined &&
          distribution[inputVar].min > distribution[inputVar].max
        )
      }
    />
  </>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LogNormalInputDistribution = ({ inputVar, distribution, handleSetValue }: InputDistProps) => (
  <>
    <InputBlock
      name="Log Location"
      value={distribution[inputVar].location !== undefined ? distribution[inputVar].location : NaN}
      onChange={value => handleSetValue(inputVar, "location", value as number)}
    />
    <InputBlock
      name="Log Scale"
      value={distribution[inputVar].scale !== undefined ? distribution[inputVar].scale : NaN}
      onChange={value => handleSetValue(inputVar, "scale", value as number)}
    />
  </>
);

export function InputVariableDist() {
  const { selectedFunction, inputVars, distribution, setDistribution } = useFunctionContext();
  const { ServiceMode: serviceMode } = useServiceContext();
  const [localDistribution, setLocalDistribution] = useState(distribution[selectedFunction?.uid || ""] || {});
  const theme = useTheme();

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

  const handleSetValue = (inputVar: string, type: string, value: number) => {
    const newInputVars = { ...localDistribution };
    if (!newInputVars[inputVar]) {
      newInputVars[inputVar] = {
        distribution: serviceMode === "SUMO" ? "uniform" : "normal",
      };
    }
    newInputVars[inputVar][type as Variables] = value;
    handleSetLocalDistribution(newInputVars);
  };

  const handleDistributionChange = (inputVar: string, value: Distribution) => {
    const newInputVars = { ...localDistribution };
    const newDist: VarSelection = { distribution: value };
    newInputVars[inputVar] = newDist;
    handleSetLocalDistribution(newInputVars);
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
    console.warn("Unknow serviceMode: ", operationMode, " for inputDistribution default!");
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
        />
      )}
      {serviceMode === "UQ" && (
        <Header
          fontWeight={300}
          headerType="subTitle"
          tabTitle="Parameter Distributions"
          infoText="Define probability distributions for each input parameter (assumed independent)"
          ExtendedInfoText={InputVariableDistDocument}
        />
      )}
      {serviceMode === "MOGA" && (
        <Header
          fontWeight={300}
          headerType="subTitle"
          tabTitle="Parameter Ranges"
          infoText="Define the range of the parameters for which you would like to examine their impact on your Quantities of Interest"
        />
      )}
      <Box sx={{ display: "flex", overflowX: "auto" }}>
        {Object.keys(localDistribution).map((inputVar, index) => (
          <Box
            key={`inputVarBox-${inputVar}`}
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
              {serviceMode !== "SUMO" && (
                <InputLabel
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    alignItems: "start",
                  }}
                >
                  Distribution Form:
                  <Select
                    variant="outlined"
                    size="small"
                    id={`${index}selector`}
                    value={localDistribution[inputVar]?.distribution || ""}
                    sx={{ minWidth: 132, width: "100%" }}
                    onChange={e => handleDistributionChange(inputVar, e.target.value as Distribution)}
                  >
                    {/* TODO include info buttons about each distribution & their parameters */}
                    <MenuItem value="constant">Constant</MenuItem>
                    <MenuItem value="normal">Normal (Gaussian)</MenuItem>
                    <MenuItem value="uniform">Uniform</MenuItem>
                    <MenuItem value="log-normal" disabled>
                      LogNormal
                    </MenuItem>
                    <MenuItem value="exponential" disabled>
                      Exponential
                    </MenuItem>
                  </Select>
                </InputLabel>
              )}
              <>
                {localDistribution[inputVar]?.distribution === "constant" && (
                  <ConstantInputDistribution
                    inputVar={inputVar}
                    distribution={localDistribution}
                    handleSetValue={handleSetValue}
                  />
                )}
                {localDistribution[inputVar]?.distribution === "normal" && (
                  <NormalInputDistribution inputVar={inputVar} distribution={localDistribution} handleSetValue={handleSetValue} />
                )}
                {localDistribution[inputVar]?.distribution === "uniform" && (
                  <UniformInputDistribution
                    inputVar={inputVar}
                    distribution={localDistribution}
                    handleSetValue={handleSetValue}
                  />
                )}
                {!localDistribution[inputVar]?.distribution && "not found"}
                {/* For v9 release, removed log-normal and exponential input distributions
                  ) : localDistribution[inputVar]?.distribution === "log-normal" ? (
                      <LogNormalInputDistribution inputVar={inputVar} />
                    ) : localDistribution[inputVar]?.distribution === "exponential" ? (
                        <ExponentialInputDistribution inputVar={inputVar} />
                */}
              </>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
