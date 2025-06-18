import React, { useEffect, useRef, useState } from "react";
import {
    Accordion,
    AccordionDetails,
    Box,
    Button,
    Container,
    useTheme,
} from "@mui/material";
import { InfoOutline } from "@mui/icons-material";
import MetaModelingUX from "../components/MetaModelingUX";
import PlusButton from "../components/PlusButton";
import JobSelector from "../components/JobSelector";
import { useMMUXContext } from "../context/MMUXContext";
import { Sampling } from "../components/Sampling";
import CustomTooltip from "../components/CustomTooltip";
import AdaptExtedSamplingDocument from "../components/documents/AdaptExtendSamplingDocument";
import QoISelector from "../components/QoISelector";

type GeneralResultsViewProps = {
    tabTitle: string;
    headerType: HeaderTypeEnum;
    children: React.ReactNode;
}
export default function GeneralResultsView(props: GeneralResultsViewProps) {
    const { children, tabTitle, headerType } = props
    const {
        outputVars,
        selectedFunction,
        setSelectedQoI,
    } = useMMUXContext();
    const theme = useTheme();
    const [loading, setLoading] = useState<boolean>(true);
    const [jobPanelOpen, setJobPanelOpen] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [jobProgress, setJobProgress] = useState<number>(0);
    const jobsFetched = useRef(0);
    const colsFetched = useRef(0);

    useEffect(() => {
        if (outputVars && outputVars.length > 0) {
            setSelectedQoI(outputVars[0]);
        }
    }, [outputVars]);

    return (
        <MetaModelingUX
            tabTitle={tabTitle}
            headerType={headerType}
        >
            <Container disableGutters>
                <Box
                    sx={{
                        justifySelf: "left",
                        flex: 1,
                        display: "flex",
                        gap: "16px",
                        color: `${theme.palette.text.primary}`,
                        marginBottom: "16px",
                        width: "100%",
                    }}
                >
                    <QoISelector />
                </Box>
                {children}
                {/* <UncertainUQ
          numSamples={localNumSamples}
          colsFetched={colsFetched}
          jobProgress={jobProgress}
          jobsFetched={jobsFetched}
          loading={loading}
          progress={progress}
        /> */}
            </Container>
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
                                color: theme.palette.text.secondary,
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
        </MetaModelingUX>
    );
}