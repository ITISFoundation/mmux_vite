import { useEffect, useRef, useState } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import SuMoModal from "./SuMoModal";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { OutputSetup } from "./OutputSetup";
import { JobSampling } from "../components/sampling/JobSampling";
import { Box, Typography } from "@mui/material";

export default function MoGa() {
  const { selectedFunction, outputVars, setSelectedQoI } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [sumoModal, setSumoModal] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  useEffect(() => {
    if (outputVars && outputVars.length > 0) {
      setSelectedQoI(outputVars[0]);
    }
  }, [outputVars, selectedFunction]);

  return (
    <MetaModelingUX
      headerType="title"
      tabTitle={`Multi Objective Genetic Algorithm: ${selectedFunction?.title}`}
    >
      <OutputSetup loading={loading} setSumoModal={setSumoModal} />
      <Box sx={{ padding: 2, justifyContent: "center", alignItems: "center" }}>
        <Typography variant="h4" gutterBottom>
          Multi Objective Genetic Algorithm Placeholder
        </Typography>
        <Typography variant="body1" gutterBottom>
          This section will contain the Multi Objective Genetic Algorithm
          functionality in the future.
        </Typography>
      </Box>
      <SuMoModal open={sumoModal} setOpen={setSumoModal} />
      <JobSampling
        loading={loading}
        setLoading={setLoading}
        progress={progress}
        setProgress={setProgress}
        jobProgress={jobProgress}
        setJobProgress={setJobProgress}
        jobsFetched={jobsFetched}
        colsFetched={colsFetched}
        selectedFunction={selectedFunction}
      />
    </MetaModelingUX>
  );
}
