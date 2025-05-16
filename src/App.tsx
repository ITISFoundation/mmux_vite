import './App.css';
import UQ from './views/UQ';
import Setup from './views/Setup';
import SuMoBuildingValidation from './views/SuMoBuilding';
import Navigation from './components/Navigation';
import { useState } from 'react';
import osparc_logo from "./assets/osparc-logo.png"
// import osparc_loading_symbol from "./assets/osparc-loading-symbol.png"
import MMUXContext from './views/MMUXContext';
import { Function } from './functions-api-ts-client';
import { FunctionIndex } from './components/FunctionIndex';
import JobIndex from './components/JobIndex';

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

        {/* Function Index and Job Index*/}
        <div className={activeStep === 98 ? "active" : "non-active"}>
          <FunctionIndex />
        </div>
        <div className={activeStep === 99 ? "active" : "non-active"}>
          <JobIndex />
        </div>

        {/* osparc logo on bottom left; access to runner status wheel on bottom right */}
        <div style={{
          display: 'flex',
          // justifyContent: "space-between",
          placeContent: "center",
          marginLeft: "5px", marginRight: "5px",
          marginBottom: "3px", marginTop: "10px"
        }}>
          <img src={osparc_logo} style={{ height: "35px" }} />
        </div>
      </div>
    </MMUXContext.Provider >
  );
}

export default App;
