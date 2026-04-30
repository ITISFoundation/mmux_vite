import InfoOutline from "@mui/icons-material/InfoOutline";
import { Accordion, Button, AccordionDetails, useTheme } from "@mui/material";
import React, { useState } from "react";
import CustomTooltip from "../utils/CustomTooltip";
import AdaptExtedSamplingDocument from "../documents/AdaptExtendSamplingDocument";
import JobSelector from "../data/JobSelector";
import PlusButton from "./PlusButton";
import { Sampling } from "./Sampling";
import { Function as OsparcFunction } from "../../osparc-api-ts-client";
import { useServiceContext } from "../../context/ServiceContext";

interface JobSamplingProps {
  loading: boolean;
  setLoading: (value: boolean) => void;
  disabled?: boolean;
  setJobProgress: (value: number) => void;
  selectedFunction: OsparcFunction | undefined;
}

export function JobSampling(props: JobSamplingProps) {
  const { loading, setLoading, setJobProgress, selectedFunction, disabled } = props;
  const { permissions } = useServiceContext();
  const theme = useTheme();
  const [jobPanelOpen, setJobPanelOpen] = useState<boolean>(false);
  const samplingDisabled = loading || disabled || permissions === "READ-ONLY";

  return (
    <Accordion
      expanded={jobPanelOpen && !samplingDisabled}
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
        disabled={samplingDisabled}
        mmux-testid="extend-sampling-btn"
        onClick={() => setJobPanelOpen(samplingDisabled ? false : !jobPanelOpen)}
      >
        Adapt / Extend Sampling
        <CustomTooltip
          title="Improve surrogate model accuracy by modifying or adding sample points"
          extendedTooltip={AdaptExtedSamplingDocument}
          placement="right"
          arrow
        >
          <InfoOutline
            sx={{
              color: samplingDisabled ? theme.palette.grey[400] : theme.palette.primary.light,
              backgroundColor: samplingDisabled ? theme.palette.grey[200] : theme.palette.background.default,
              borderRadius: "50%",
              padding: "2px",
              marginLeft: "8px",
            }}
          />
        </CustomTooltip>
      </Button>
      <AccordionDetails sx={{ padding: "0", paddingTop: "16px" }}>
        <JobSelector loading={loading} setLoading={setLoading} setJobProgress={setJobProgress} />
        {selectedFunction !== undefined ? (
          <PlusButton
            onClickFun={() => null}
            plotFunComponent={Sampling}
            text="Create new sampling campaign"
            enabled={selectedFunction !== undefined}
            mmmuxTestid="new-sampling-campaign-btn"
          />
        ) : undefined}
      </AccordionDetails>
    </Accordion>
  );
}
