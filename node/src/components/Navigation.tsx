import { Button, styled } from '@mui/material';

const NavBar = styled('div')`
display: flex;
justify-content: center;
align-items: center;
gap: 30px;
padding-top: 10px;
padding-bottom: 10px;
background-color: #07080a;
& .nav-btn.non-active {
  background-color: #525252;
}
& .nav-btn.active {
  background-color: #0090D0; /* S4L blue */
}`;

const NavButton = styled(Button, { shouldForwardProp: (props) => props !== 'active'})<{ active: boolean }>(({ active }) => `
  background-color: ${active ? '#0090D0' : '#525252'};
`)

function Navigation(props: NavigationProps) {
  return (
    <NavBar>
      {props.steps.map((step) => (
        <NavButton
          active={props.activeStep === step.id}
          key={step.id}
          variant={props.activeStep === step.id ? "contained" : "outlined"}
          onClick={() => props.setActiveStep(step.id)}
        >
          {step.id}: {step.label}
        </NavButton>
      ))}
    </NavBar>
  );
}
export default Navigation;