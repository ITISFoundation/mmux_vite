import './App.css';
import UQ from './views/UQ';
import Setup from './views/Setup';
import SuMoBuildingValidation from './views/SuMoBuilding';
import Navigation from './components/Navigation';
import { useState } from 'react';
import MMUXContext from './views/MMUXContext';
import { Function } from './osparc-api-ts-client';

function App() {
  const steps = [
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
  const defaultMMUXContext = {
    selectedFunction: funct,
    setSelectedFunction: setFunct,
    currentView: activeStep,
    setCurrentView: (i: number) => {
      // setPreviousViews(prev => [...prev, i])
      setActiveStep(i)
    },
    // previousViews: previousViews;
    // setPreviousViews: setPreviousViews;
  }

  return (
    <MMUXContext.Provider value={defaultMMUXContext} >
      <div className="background-card">
        {/* Top, it shows the different "tabs" as if it were AppMode */}
        <div className='navigation'>
          <Navigation steps={steps} activeStep={activeStep} setActiveStep={setActiveStep} />
        </div>

        <div className={activeStep === 1 ? "active" : "non-active"}>
          <Setup />
        </div>
        <div className={activeStep === 2 ? "active" : "non-active"}>
          <SuMoBuildingValidation />
        </div>
        <div className={activeStep === 3 ? "active" : "non-active"}>
          <UQ />
        </div>

      </div>
    </MMUXContext.Provider >
  );
}

export default App;
