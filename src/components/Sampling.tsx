import React from 'react'
import { Box, Tabs, Tab, styled} from '@mui/material';
import LHSSampling from './LHSSampling';
import GridSearchSampling from './GridSearchSampling';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const Container = styled('div')`
  width: 100%;
  background-color: #f5f5f5;
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
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export const Sampling = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="LHS Sampling" {...a11yProps(0)} />
          <Tab label="Grid Search Sampling" {...a11yProps(1)} />
          <Tab label="New Sampling" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        {<LHSSampling />}
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        {<GridSearchSampling />}
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        New Sampling item!
      </CustomTabPanel>
      <div>
      </div>
    </Container>
  )
}
