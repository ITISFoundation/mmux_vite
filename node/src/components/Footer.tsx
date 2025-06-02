import React from 'react'
import { Box, Button, Container, Modal, Paper, styled } from '@mui/material'
import { useMMUXContext } from '../context/MMUXContext';
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
  const { mode, setMode } = props;
  const context = useMMUXContext();
  const { currentView, setCurrentView, runningSampling } = context;
  const [modal, setModal] = React.useState(false);
  const isJobsRunning = runningSampling;

  const handleModeChange = () => {
    console.log('Changing mode from', mode);
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  return (
    <>
    <Cont>
        <Paper className='footerBox' variant="outlined">
          <Button className='footerBtn footerBtnFirst' onClick={()=>setCurrentView(currentView <= 0 ? 0 : currentView -1)} disabled={currentView <= 0}>Previous</Button>
          <Box>
            <Button className='footerBtn' onClick={() => setModal(!modal)} disabled={!isJobsRunning}>Tasks running</Button>
            <Button className='footerBtn' onClick={handleModeChange}>{mode === 'light' ? <LightMode/> : <DarkMode/>}</Button>
          </Box>
          <Button
            className='footerBtn footerBtnLast'
            onClick={()=>setCurrentView(currentView >= 3 ? 3 : currentView +1)}
            disabled={currentView >= 3 || !stepValidator(context, currentView)}
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
