import { useState } from 'react';
import { styled } from '@mui/material/styles';
import UQ from './views/UQ';
import Setup from './views/Setup';
import Navigation from './components/Navigation';
import MMUXContext from './views/MMUXContext';
import { Function } from './osparc-api-ts-client';
import SuMoBuildingValidation from './views/SuMoBuilding';

const Container = styled('div')`
max-width: 1000px;
margin: 0 auto; /* center alignment of the app*/
`;

const App = () => {
  const steps: Step[] = [
    { id: 1, label: "Setup" },
    { id: 2, label: "SuMo" },
    { id: 3, label: "UQ" },
    // Do not include the ones below - this is for the navigation bar
    // { id: 98, label: "FunctionIndex" },
    // { id: 99, label: "JobIndex" },
  ];
  const [activeStep, setActiveStep] = useState(steps[0].id)
  // const [previousViews, setPreviousViews] = useState<number[]>([])
  const [funct, setFunct] = useState<Function | undefined>(undefined)
  const [launchingSampling, setLaunchingSampling] = useState<boolean>(false)
  const [runningSampling, setRunningSampling] = useState<boolean>(false)
  const defaultMMUXContext = {
    selectedFunction: funct,
    setSelectedFunction: setFunct,
    currentView: activeStep,
    setCurrentView: (i: number) => {
      setActiveStep(i)
    },
    launchingSampling: launchingSampling,
    setLaunchingSampling: (b: boolean) => {
      setLaunchingSampling(b)
    },
    runningSampling: runningSampling,
    setRunningSampling: (b: boolean) => {
      setRunningSampling(b)
    }

  }

  return (
    <MMUXContext.Provider value={defaultMMUXContext} >
      <Container>
        {/* Top, it shows the different "tabs" as if it were AppMode */}
        <Navigation steps={steps} activeStep={activeStep} setActiveStep={setActiveStep} />
        { activeStep === 1 ? <Setup /> : undefined}
        { activeStep === 2 ? <SuMoBuildingValidation /> : undefined}
        { activeStep === 3 ? <UQ /> : undefined}
      </Container>
    </MMUXContext.Provider >
  );
}

export default App;
