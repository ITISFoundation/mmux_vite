import { InfoOutline } from "@mui/icons-material";
import { Accordion, Button, AccordionDetails } from "@mui/material";
import React, { useState } from "react";
import CustomTooltip from "../CustomTooltip";
import AdaptExtedSamplingDocument from "../documents/AdaptExtendSamplingDocument";
import JobSelector from "../JobSelector";
import PlusButton from "./PlusButton";
import { Sampling } from "./Sampling";
import { Function } from "../../osparc-api-ts-client";

interface JobSamplingProps {
  loading: boolean;
  setLoading: (value: boolean) => void;
  progress: number;
  setProgress: (value: number) => void;
  jobProgress: number;
  setJobProgress: (value: number) => void;
  jobsFetched: React.MutableRefObject<number>;
  colsFetched: React.MutableRefObject<number>;
  selectedFunction: Function | undefined;
}

export const JobSampling = (props: JobSamplingProps) => {
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
  } = props;
  const [jobPanelOpen, setJobPanelOpen] = useState<boolean>(false);

  return (
    <Accordion
      expanded={jobPanelOpen}
      disableGutters
      variant="outlined"
      sx={{
        marginTop: "16px",
        border: "none",
        "&:before": { display: "none" },
      }}
    >
      <Button
        variant="contained"
        color="primary"
        disabled={loading}
        onClick={() => setJobPanelOpen(loading ? false : !jobPanelOpen)}
        sx={{
          minHeight: "auto",
          padding: "4px 8px 4px 16px",
          margin: `0 0 ${jobPanelOpen ? "16px" : "0px"} 0`,
        }}
      >
        Adapt / Extend Sampling
        <CustomTooltip
          title="Improve surrogate model accuracy by modifying or adding sample points"
          ExtendedTootlip={AdaptExtedSamplingDocument}
          placement="right"
          arrow
        >
          <InfoOutline
            sx={(theme) => ({
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.grey[100],
              borderRadius: "50%",
              padding: "2px",
              marginLeft: "8px",
            })}
          />
        </CustomTooltip>
      </Button>
      <AccordionDetails sx={{ padding: "0" }}>
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
            PlotFunComponent={() => {
              return <Sampling />;
            }}
            text="Create new sampling campaign"
            enabled={selectedFunction !== undefined}
          />
        ) : undefined}
      </AccordionDetails>
    </Accordion>
  );
};
