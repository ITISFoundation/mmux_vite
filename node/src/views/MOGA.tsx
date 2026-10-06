import { useRef, useState } from "react";
import MOGAModal from "./MOGAModal";
import ValidationModal from "./ValidationModal";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { Box, Button } from "@mui/material";
import { JobSampling } from "../components/sampling/JobSampling";
import { useFunctionContext } from "../context/FunctionContext";
import { MOGAPareto } from "../components/plots/MOGAPareto";

export default function MOGA() {
  const { selectedFunction } = useFunctionContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [sumoModal, setSumoModal] = useState<boolean>(false);
  const [mogaModal, setMogaModal] = useState<boolean>(false);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  return (
    <MetaModelingUX headerType="title" tabTitle={`Multi Objective Genetic Algorithm: ${selectedFunction?.title}`}>
      <Box display="flex" justifyContent="space-between" gap={2} padding="0 4px 16px">
        <Button variant="contained" size="small" disabled={loading || !selectedFunction} onClick={() => setMogaModal(true)}>
          Optimization Settings
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={loading || !selectedFunction}
          onClick={() => setSumoModal(true)}
          mmux-testid="inspect-model-button"
        >
          Inspect Model
        </Button>
      </Box>
      <MOGAPareto
        colsFetched={colsFetched}
        jobProgress={jobProgress}
        jobsFetched={jobsFetched}
        loading={loading}
        setCalculating={setCalculating}
      />
      <ValidationModal open={sumoModal} setOpen={setSumoModal} />
      <MOGAModal open={mogaModal} setOpen={setMogaModal} />
      <JobSampling
        loading={loading}
        setLoading={setLoading}
        disabled={calculating}
        setJobProgress={setJobProgress}
        selectedFunction={selectedFunction}
      />
    </MetaModelingUX>
  );
}
