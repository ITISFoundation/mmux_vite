import React, { useContext } from 'react'
import { Box, Button, Container, Modal, Paper, styled } from '@mui/material'
import MMUXContext, { MMUXContextType } from '../views/MMUXContext';
import JobsDashboard from '../views/ParallelRunner';
import { DarkMode, LightMode } from '@mui/icons-material';
import { stepValidator } from '../utils/stepValidator';

const Cont = styled(Container)`
padding: 0 !important;
& .footerBox {
  padding: 1em 0;
  margin-top: 2em;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
}
& .footerBtn {
  margin: 0 1em;
}
`

export const Footer = (props: FooterProps) => {
  const { mode, setMode, activeStep, setActiveStep } = props;
  const [modal, setModal] = React.useState(false);
  const context: MMUXContextType | undefined = useContext(MMUXContext);
  const isJobsRunning = context?.runningSampling;

  const handleModeChange = () => {
    console.log('Changing mode from', mode);
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  return (
    <>
    <Cont>
        <Paper className='footerBox' variant="outlined">
          <Button className='footerBtn footerBtnFirst' onClick={()=>setActiveStep(activeStep <= 0 ? 0 : activeStep -1)} disabled={activeStep <= 0}>Previous</Button>
          <Box>
            <Button className='footerBtn' onClick={() => setModal(!modal)} disabled={!isJobsRunning}>Tasks running</Button>
            <Button className='footerBtn' onClick={handleModeChange}>{mode === 'light' ? <LightMode/> : <DarkMode/>}</Button>
          </Box>
          <Button
            className='footerBtn footerBtnLast'
            onClick={()=>setActiveStep(activeStep >= 3 ? 3 : activeStep +1)}
            disabled={activeStep >= 3 || !stepValidator(context, activeStep)}
          >
            Next
          </Button>
        </Paper>
    </Cont>
    <Modal
      open={modal}
      onClose={() => setModal(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        margin: 'auto',
        width: '80vw',
        height: '80vh',
      }}
      >
        { isJobsRunning && isJobsRunning === true ? <JobsDashboard progressBarOnly={false} /> : <></>}
      </Modal>
    </>
  )
}
