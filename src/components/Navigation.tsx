import { Button } from '@mui/material';
import './Navigation.css';

function Navigation(props) {
  return (
    <div className="nav-bar">
      {props.steps.map((step) => (
        <Button
          className={`nav-btn${props.activeStep === step.id ? ' active' : ''}`}
          key={step.id}
          variant={props.activeStep === step.id ? "contained" : "outlined"}
          onClick={() => props.setActiveStep(step.id)}
        >
          {step.id}: {step.label}
        </Button>
      ))}
    </div>
  );
}
export default Navigation;