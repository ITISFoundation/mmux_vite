import React from 'react';
import { Button } from '@mui/material';
import './Navigation.css';

function Navigation(props) {
  return (
    <div className="nav-bar">
      {props.steps.map((step) => (
        <Button
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