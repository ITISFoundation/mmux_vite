import React from 'react'
import { Box, Button, Container, Paper, styled } from '@mui/material'
import { DarkMode, LightMode } from '@mui/icons-material';

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

interface FooterProps {
  mode: 'light' | 'dark' | 'system' | undefined;
  setMode: ( mode: 'light' | 'dark' ) => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
}

export const Footer = (props: FooterProps) => {
  const { mode, setMode, activeStep, setActiveStep } = props;

  const handleModeChange = () => {
    console.log('Changing mode from', mode);
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  return (
    <Cont>
        <Paper className='footerBox' variant="outlined">
          <Button className='footerBtn footerBtnFirst' onClick={()=>setActiveStep(activeStep <= 0 ? 0 : activeStep -1)} disabled={activeStep <= 0}>Previous</Button>
          <Box>
            <Button className='footerBtn'>Tasks running</Button>
            <Button className='footerBtn' onClick={handleModeChange}>{mode === 'light' ? <LightMode/> : <DarkMode/>}</Button>
          </Box>
          <Button className='footerBtn footerBtnLast' onClick={()=>setActiveStep(activeStep >= 2 ? 2 : activeStep +1)} disabled={activeStep >= 2}>Next</Button>
        </Paper>
    </Cont>
  )
}
