import { InfoOutline } from "@mui/icons-material";
import { Accordion, Button, AccordionDetails, useTheme } from "@mui/material";
import React, { useState } from "react";
import CustomTooltip from "../utils/CustomTooltip";
import AdaptExtedSamplingDocument from "../documents/AdaptExtendSamplingDocument";
import JobSelector from "../data/JobSelector";
import PlusButton from "./PlusButton";
import { Sampling } from "./Sampling";
import { Function as OsparcFunction } from "../../osparc-api-ts-client";

interface JobSamplingProps {
  loading: boolean;
  setLoading: (value: boolean) => void;
  disabled?: boolean;
  progress: number;
  setProgress: (value: number) => void;
  jobProgress: number;
  setJobProgress: (value: number) => void;
  jobsFetched: React.MutableRefObject<number>;
  colsFetched: React.MutableRefObject<number>;
  selectedFunction: OsparcFunction | undefined;
}

export function JobSampling(props: JobSamplingProps) {
  const {
    loading,
    setLoading,
    progress,
    setProgress,
    jobProgress,
    setJobProgress,
    colsFetched,
    jobsFetched,
    selectedFunction,
    disabled,
  } = props;
  const theme = useTheme();
  const [jobPanelOpen, setJobPanelOpen] = useState<boolean>(false);

  return (
    <Accordion
      expanded={jobPanelOpen && !loading && !disabled}
      disableGutters
      variant="outlined"
      sx={{
        marginTop: "16px",
        padding: "0px",
        border: "none",
        "&:before": { display: "none" },
      }}
    >
      <Button
        variant="contained"
        color="primary"
        disabled={loading || disabled}
        mmux-testid="extend-sampling-btn"
        onClick={() => setJobPanelOpen(loading || disabled ? false : !jobPanelOpen)}
      >
        Adapt / Extend Sampling
        <CustomTooltip
          title="Improve surrogate model accuracy by modifying or adding sample points"
          ExtendedTooltip={AdaptExtedSamplingDocument}
          placement="right"
          arrow
        >
          <InfoOutline
            sx={{
              color: loading || disabled ? theme.palette.grey[400] : theme.palette.primary.light,
              backgroundColor: loading || disabled ? theme.palette.grey[200] : theme.palette.background.default,
              borderRadius: "50%",
              padding: "2px",
              marginLeft: "8px",
            }}
          />
        </CustomTooltip>
      </Button>
      <AccordionDetails sx={{ padding: "0", paddingTop: "16px" }}>
        <JobSelector
          loading={loading}
          setLoading={setLoading}
          progress={progress}
          setProgress={setProgress}
          jobProgress={jobProgress}
          setJobProgress={setJobProgress}
          jobsFetched={jobsFetched}
          colsFetched={colsFetched}
        />
        {selectedFunction !== undefined ? (
          <PlusButton
            onClickFun={() => null}
            PlotFunComponent={Sampling}
            text="Create new sampling campaign"
            enabled={selectedFunction !== undefined}
            mmmuxTestid="new-sampling-campaign-btn"
          />
        ) : undefined}
      </AccordionDetails>
    </Accordion>
  );
}
