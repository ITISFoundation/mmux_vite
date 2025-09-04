import React from "react";
import { Box, Tabs, Tab, styled } from "@mui/material";
import LHSSampling from "./LHSSampling";
import GridSearchSampling from "./GridSearchSampling";
import TestJob from "./RunSingleJob";

const Container = styled("div")(
  ({ theme }) => `
  width: 100%;
  background-color: ${theme.palette.background.default};
`,
);

const TabContainer = styled(Box)`
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.palette.divider};
`;

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export function Sampling() {
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container sx={theme => ({ borderRadius: theme.spacing(2) })}>
      <TabContainer>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="LHS Sampling" {...a11yProps(0)} />
          <Tab label="Grid Sampling" {...a11yProps(1)} />
          <Tab label="Test Run" {...a11yProps(2)} />
        </Tabs>
      </TabContainer>
      <CustomTabPanel value={value} index={0}>
        <LHSSampling />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <GridSearchSampling />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <TestJob />
      </CustomTabPanel>
    </Container>
  );
}
