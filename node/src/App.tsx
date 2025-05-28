import { useState } from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import { Container, useColorScheme } from "@mui/material";
import { ToastContainer } from 'react-toastify';
import { setupTheme } from "./theme";
import Navigation from "./components/Navigation";
import { Footer } from "./components/Footer";
import MMUXContext, { MMUXContextType } from "./views/MMUXContext";
import Setup from "./views/Setup";
import JobSetup from "./views/JobSetup";
import { Function, RegisteredFunctionJobCollection } from "./osparc-api-ts-client";
import SuMoBuildingValidation from "./views/SuMoBuilding";
import UQ from "./views/UQ";

const FakeRoot = styled("div")(
  ({ theme }) => `
  min-height: 100vh;
  height: 100%;
  background-color: ${theme.palette.background.default};
`);

const App = () => {
  const steps: Step[] = [
    { id: 0, label: "Setup" },
    { id: 1, label: "Job Setup" },
    { id: 2, label: "SuMo" },
    { id: 3, label: "UQ" },
    // Do not include the ones below - this is for the navigation bar
    // { id: 98, label: "FunctionIndex" },
    // { id: 99, label: "JobIndex" },
  ];
  const [activeStep, setActiveStep] = useState(steps[0].id);
  // const [previousViews, setPreviousViews] = useState<number[]>([])
  const [funct, setFunct] = useState<Function | undefined>(undefined);
  const [launchingSampling, setLaunchingSampling] = useState<boolean>(false);
  const [runningSampling, setRunningSampling] = useState<boolean>(false);
  const [selectedJobUids, setSelectedJobUids] = useState<Array<string>>([]);
  const [inputVars, setInputVars] = useState<string[] | undefined>(undefined);
  const [distribution, setDistribution] = useState<InputVarSelection>({});
  const [outputVars, setOutputVars] = useState<string[] | undefined>(undefined);
  const [runningJobCollection, setRunningJobCollection] = useState<RegisteredFunctionJobCollection | undefined>(undefined);

  const { mode, systemMode, setMode } = useColorScheme();
  const finalMode = mode
  ? mode === "system"
  ? systemMode
  ? systemMode
  : "dark"
  : mode
  : "dark";
  const [themeMode, setThemeMode] = useState<"light" | "dark">(finalMode);
  const theme = setupTheme(themeMode);

  const setThemeModeHandler = (newMode: "light" | "dark") => {
    console.log("Setting theme mode to", newMode);
    setThemeMode(newMode);
    setMode(newMode);
  };

  const defaultMMUXContext: MMUXContextType = {
    selectedFunction: funct,
    setSelectedFunction: setFunct,
    distribution: distribution,
    setDistribution: setDistribution,
    inputVars: inputVars,
    setInputVars: setInputVars,
    outputVars: outputVars,
    setOutputVars: setOutputVars,
    currentView: activeStep,
    setCurrentView: setActiveStep,
    launchingSampling: launchingSampling,
    setLaunchingSampling: setLaunchingSampling,
    runningSampling: runningSampling,
    setRunningSampling: setRunningSampling,
    runningJobCollection: runningJobCollection,
    setRunningJobCollection: setRunningJobCollection,
    selectedJobUids: selectedJobUids,
    setSelectedJobUids: setSelectedJobUids,
  };

  return (
    <MMUXContext.Provider value={defaultMMUXContext}>
      <ThemeProvider theme={theme}>
        <FakeRoot>
          <Container>
            <Navigation
              steps={steps}
              activeStep={activeStep}
            />
            <>
              {activeStep === 0 ? <Setup /> : undefined}
              {activeStep === 1 ? <JobSetup /> : undefined}
              {activeStep === 2 ? <SuMoBuildingValidation /> : undefined}
              {activeStep === 3 ? <UQ /> : undefined}
            </>
            <Footer mode={themeMode} setMode={setThemeModeHandler} activeStep={activeStep} setActiveStep={setActiveStep} />
          </Container>
          <ToastContainer
            theme={themeMode}
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable={false}
            pauseOnHover
          />
        </FakeRoot>
      </ThemeProvider>
    </MMUXContext.Provider>
  );
};

export default App;