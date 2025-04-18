import './App.css';
import UQ from './views/UQ';
import Setup from './views/Setup';
import SuMoBuildingValidation from './views/SuMoBuilding';
import Navigation from './components/Navigation';
import { useState } from 'react';
import FunctionIndex from "./components/FunctionIndex"
import JobIndex from "./components/JobIndex"
import osparc_logo from "./assets/osparc-logo.png"
import osparc_loading_symbol from "./assets/osparc-loading-symbol.png"

function App() {
  const steps = [
    { id: 1, label: "Setup" },
    { id: 2, label: "SuMo" },
    { id: 3, label: "UQ" }
  ];
  const [activeStep, setActiveStep] = useState(steps[0].id)

  function ArrowsWrapper(props: any) {
    // OPTION 1: In the middle of the screen (not-widthstanding the size of the MMUX box)
    // return (
    // <div style={{ display: 'flex', justifyContent: "space-between", marginLeft:"5px", marginRight: "5px",  marginBottom:"3px", marginTop:"10px"}}>
    //   <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(50%)', cursor: 'pointer' }} onClick={() => setActiveStep(prev => Math.max(prev - 1, steps[0].id))}>
    //     &#9664; 
    //   </div>
    //   <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setActiveStep(prev => Math.min(prev + 1, steps[steps.length - 1].id))}>
    //     &#9654;
    //   </div>
    //   {props.children}
    // </div>
    // )

    // OPTION 2: WELL CENTERED VERTICALLY wrt the MMUX box
    return (
      <div style={{ position: 'relative', justifyContent: "space-between", width: '100%' }}>
        <div style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setActiveStep(prev => Math.max(prev - 1, steps[0].id))}>
          &#9664;
        </div>
        <div style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setActiveStep(prev => Math.min(prev + 1, steps[steps.length - 1].id))}>
          &#9654;
        </div>
        {props.children}
      </div>

    )
  }

  return (
    <ArrowsWrapper>
      <div className="background-card">
        {/* Top, it shows the different "tabs" as if it were AppMode */}
        <div className='navigation'>
          <Navigation steps={steps} activeStep={activeStep} setActiveStep={setActiveStep} />
        </div>

        {/* Shows the active tab. The page is not reloaded - this way, state is kept. 
        TODO save state of components to JSON to preserve across runs.*/}
        <div className={activeStep === 1 ? "active": "non-active"}>
          <Setup setActiveStep={setActiveStep} />
        </div>
        <div className={activeStep === 2 ? "active": "non-active"}>
          <SuMoBuildingValidation />
        </div>
        <div className={activeStep === 3 ? "active": "non-active"}>
          <UQ />
        </div>

        {/* Function Index and Job Index */}
        <div className={activeStep === 98 ? "active": "non-active"}>
          <FunctionIndex />
        </div>
        <div className={activeStep === 99 ? "active": "non-active"}>
          <JobIndex />
        </div>

        {/* osparc logo on bottom left; access to runner status wheel on bottom right */}
        <div style={{ display: 'flex', justifyContent: "space-between", marginLeft:"5px", marginRight: "5px",  marginBottom:"3px", marginTop:"10px"}}>
          <img src={osparc_logo} height={25} />
          <img src={osparc_loading_symbol} height={25} alt="Jobs" onClick={()=>setActiveStep(99)}/>
        </div>
      </div>
    </ArrowsWrapper>
    // <FunctionIndex />

  );
}

export default App;
