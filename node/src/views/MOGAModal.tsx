/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import {
  Modal,
  useTheme,
  Card,
  Box,
  CardContent,
  Button,
  CardActions,
  InputLabel,
  Typography,
  TextField,
  Link,
} from "@mui/material";
import { InfoOutline } from "@mui/icons-material";
import Header from "../components/navigation/Header";
import OptionSelect from "../components/utils/OptionSelect";
import {
  useMOGASettingsContext,
  defaultMogaValues,
  MOGASettings,
  FitnessType,
  ReplacementType,
} from "../context/MOGASettingsContext";
import { useFunctionContext } from "../context/FunctionContext";
import CustomTooltip from "../components/utils/CustomTooltip";

const populationSizeInfo = (
  <span>
    The number of individuals in each generation. A larger population size increases genetic diversity but also increases
    computational cost.{" "}
    <Link
      target="_blank"
      href="https://snl-dakota.github.io/docs/6.19.0/users/usingdakota/reference/method-moga.html?highlight=moga"
    >
      More info...
    </Link>
  </span>
);

const iterationsInfo = (
  <span>
    The number of generations the algorithm will run. More iterations allow for better convergence but take more time.{" "}
    <Link
      target="_blank"
      href="https://snl-dakota.github.io/docs/6.19.0/users/usingdakota/reference/method-moga.html?highlight=moga"
    >
      More info...
    </Link>
  </span>
);

const fitnessTypeInfo = (
  <span>
    The method used to evaluate the quality of solutions. &quot;Layer Rank&quot; ranks solutions based on their dominance layers,
    while &quot;Domination Count&quot; counts how many solutions a particular solution dominates.{" "}
    <Link
      target="_blank"
      href="https://snl-dakota.github.io/docs/6.19.0/users/usingdakota/reference/method-moga.html?highlight=moga"
    >
      More info...
    </Link>
  </span>
);

const replacementTypeInfo = (
  <span>
    The strategy for selecting individuals for the next generation. Below Limit&quot; selects individuals below a certain fitness threshold,
    &quot;Elitist&quot; retains the best individuals,
    &quot;Unique Roulette Wheel&quot; selects (unique) individuals based on fitness proportion.{" "}
    <Link
      target="_blank"
      href="https://snl-dakota.github.io/docs/6.19.0/users/usingdakota/reference/method-moga.html?highlight=moga"
    >
      More info...
    </Link>
  </span>
);

const seedInfo = (
  <span>
    The seed for the random number generator, ensuring reproducibility of results.{" "}
    <Link
      target="_blank"
      href="https://snl-dakota.github.io/docs/6.19.0/users/usingdakota/reference/method-moga.html?highlight=moga"
    >
      More info...
    </Link>
  </span>
);

const seedNumberInfo = (
  <span>
    Allows to run the MOGA optimization multiple times with identical configuration and multiple seeds
    (starting at the seed specified above and incrementing in integer steps). Increasing this number keeps
    previous results and adds new MOGA runs. Wider variability
    of starting conditions increases exploration and variety of results.{" "}
    <Link
      target="_blank"
      href="https://snl-dakota.github.io/docs/6.19.0/users/usingdakota/reference/method-moga.html?highlight=moga"
    >
      More info...
    </Link>
  </span>
);

const MOGAModal = ({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) => {
  const theme = useTheme();
  const { selectedFunction } = useFunctionContext();
  const { mogaSettings, setMOGASettings } = useMOGASettingsContext();
  const [populationSize, setPopulationSize] = useState<number>(
    mogaSettings[selectedFunction?.uid || ""]?.populationSize || defaultMogaValues.populationSize,
  );
  const [maxIterations, setMaxIterations] = useState<number>(
    mogaSettings[selectedFunction?.uid || ""]?.maxIterations || defaultMogaValues.maxIterations,
  );
  const [fitnessType, setFitnessType] = useState<FitnessType>(
    mogaSettings[selectedFunction?.uid || ""]?.fitnessType || defaultMogaValues.fitnessType,
  );
  const [replacementType, setReplacementType] = useState<ReplacementType>(
    mogaSettings[selectedFunction?.uid || ""]?.replacementType || defaultMogaValues.replacementType,
  );
  const [seed, setSeed] = useState<number>(mogaSettings[selectedFunction?.uid || ""]?.seed || defaultMogaValues.seed);
  const [numberSeeds, setNumberSeeds] = useState<number>(1);

  const popSizeError = Number.isNaN(populationSize) || populationSize < 1 || populationSize > 1000000;
  const iterError = Number.isNaN(maxIterations) || maxIterations < 1 || maxIterations > 1000000;
  const seedError = Number.isNaN(seed) || seed < 1 || seed > 1000000;
  const numberSeedsError = Number.isNaN(numberSeeds) || numberSeeds < 1 || numberSeeds > 1000000;

  const resetFields = () => {
    setPopulationSize(mogaSettings[selectedFunction?.uid || ""]?.populationSize || defaultMogaValues.populationSize);
    setMaxIterations(mogaSettings[selectedFunction?.uid || ""]?.maxIterations || defaultMogaValues.maxIterations);
    setFitnessType(mogaSettings[selectedFunction?.uid || ""]?.fitnessType || defaultMogaValues.fitnessType);
    setReplacementType(mogaSettings[selectedFunction?.uid || ""]?.replacementType || defaultMogaValues.replacementType);
    setSeed(mogaSettings[selectedFunction?.uid || ""]?.seed || defaultMogaValues.seed);
    setNumberSeeds(1);
  };

  const handleSetData = () => {
    const newMogaSettings: MOGASettings = {
      ...mogaSettings,
      [selectedFunction?.uid || ""]: {
        populationSize,
        maxIterations,
        fitnessType,
        replacementType,
        seed,
        numberSeeds,
      },
    };
    setMOGASettings(newMogaSettings);
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        margin: "auto",
        width: "80%",
        maxWidth: "480px",
        height: "80%",
      }}
    >
      <Card
        sx={{
          overflow: "auto",
          backgroundImage: "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Header
            headerType="titleNoMargin"
            tabTitle="Optimization Configuration"
            infoText="Configure the optimization settings for MOGA."
          />
        </Box>
        <CardContent
          sx={{
            padding: 0,
            margin: "16px 0px",
            borderRadius: theme.spacing(2),
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", padding: "0px 8px" }}>
            <InputLabel
              size="small"
              sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
            >
              <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                Population Size
                <CustomTooltip title={populationSizeInfo} placement="right" arrow>
                  <InfoOutline
                    sx={{
                      color: theme.palette.primary.light,
                      backgroundColor: theme.palette.background.default,
                      borderRadius: "50%",
                      padding: "2px",
                      marginLeft: "2px",
                      marginRight: "2px",
                      marginBottom: "2px",
                      fontSize: "20px",
                    }}
                  />
                </CustomTooltip>
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                mmux-testid="input-block"
                InputProps={{ inputProps: { min: 1, max: 1000000 } }}
                error={popSizeError}
                value={Number.isNaN(populationSize) ? "" : populationSize}
                onChange={e => setPopulationSize(parseInt(e.target.value, 10))}
                aria-label="Population Size"
              />
            </InputLabel>
            <InputLabel
              size="small"
              sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
            >
              <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                Iterations
                <CustomTooltip title={iterationsInfo} placement="right" arrow>
                  <InfoOutline
                    sx={{
                      color: theme.palette.primary.light,
                      backgroundColor: theme.palette.background.default,
                      borderRadius: "50%",
                      padding: "2px",
                      marginLeft: "2px",
                      marginRight: "2px",
                      marginBottom: "2px",
                      fontSize: "20px",
                    }}
                  />
                </CustomTooltip>
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                mmux-testid="input-block"
                InputProps={{ inputProps: { min: 1, max: 1000000 } }}
                error={iterError}
                value={Number.isNaN(maxIterations) ? "" : maxIterations}
                onChange={e => setMaxIterations(parseInt(e.target.value, 10))}
                aria-label="Iterations"
              />
            </InputLabel>
            <OptionSelect
              property="Fitness Type"
              currentValue={fitnessType}
              setCurrentValue={setFitnessType}
              possibleValues={[
                { key: "layer_rank", label: "Layer Rank" },
                { key: "domination_count", label: "Domination Count" },
              ]}
              title={fitnessTypeInfo}
            />
            <OptionSelect
              property="Replacement Type"
              currentValue={replacementType}
              setCurrentValue={setReplacementType}
              possibleValues={[
                { key: "below_limit", label: "Below Limit" }, // should be the default, according to Dakota docs
                { key: "elitist", label: "Elitist" },
                // { key: "roulette_wheel", label: "Roulette Wheel" },  // Dakota crashes with this option
                { key: "unique_roulette_wheel", label: "Unique Roulette Wheel" },
              ]}
              title={replacementTypeInfo}
            />
            <InputLabel
              size="small"
              sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
            >
              <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                Initial Seed
                <CustomTooltip title={seedInfo} placement="right" arrow>
                  <InfoOutline
                    sx={{
                      color: theme.palette.primary.light,
                      backgroundColor: theme.palette.background.default,
                      borderRadius: "50%",
                      padding: "2px",
                      marginLeft: "2px",
                      marginRight: "2px",
                      marginBottom: "2px",
                      fontSize: "20px",
                    }}
                  />
                </CustomTooltip>
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                mmux-testid="input-block"
                InputProps={{ inputProps: { min: 1, max: 1000000 } }}
                error={seedError}
                value={Number.isNaN(seed) ? "" : seed}
                onChange={e => {
                  const value = parseInt(e.target.value, 10);
                  setSeed(Number.isNaN(value) ? 0 : value);
                }}
                aria-label="Seed"
              />
            </InputLabel>
            <InputLabel
              size="small"
              sx={{ flex: "1", display: "flex", flexDirection: "row", alignItems: "center", transform: "none" }}
            >
              <Typography variant="body1" component="p" fontWeight={400} sx={{ flex: 1 }}>
                Number of Seeds
                <CustomTooltip title={seedNumberInfo} placement="right" arrow>
                  <InfoOutline
                    sx={{
                      color: theme.palette.primary.light,
                      backgroundColor: theme.palette.background.default,
                      borderRadius: "50%",
                      padding: "2px",
                      marginLeft: "2px",
                      marginRight: "2px",
                      marginBottom: "2px",
                      fontSize: "20px",
                    }}
                  />
                </CustomTooltip>
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                mmux-testid="input-block"
                InputProps={{ inputProps: { min: 1, max: 1000000 } }}
                error={numberSeedsError}
                value={Number.isNaN(numberSeeds) ? "" : numberSeeds}
                onChange={e => setNumberSeeds(parseInt(e.target.value, 10))}
                aria-label="Seed"
              />
            </InputLabel>
          </Box>
        </CardContent>
        <CardActions sx={{ padding: 0, display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={() => {
              resetFields();
              setOpen(false);
            }}
            sx={{
              alignItems: "start",
              color: theme.palette.grey[700],
              borderColor: theme.palette.grey[700],
              backgroundColor: "transparent",
            }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleSetData();
              setOpen(false);
            }}
            sx={{ alignItems: "end" }}
            disabled={popSizeError || iterError || !selectedFunction}
          >
            Apply
          </Button>
        </CardActions>
      </Card>
    </Modal>
  );
};

export default MOGAModal;
