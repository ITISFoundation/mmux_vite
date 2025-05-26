import { useState } from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import { Container, useColorScheme } from "@mui/material";
import { setupTheme } from "./theme";
import { Function } from "./osparc-api-ts-client";
import Navigation from "./components/Navigation";
import { Footer } from "./components/Footer";
import MMUXContext from "./views/MMUXContext";
import Setup from "./views/Setup";
import JobSetup from "./views/JobSetup";
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
  const [selectedJobs, setSelectedJobs] = useState<Array<string>>([]);

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

  const defaultMMUXContext = {
    selectedFunction: funct,
    setSelectedFunction: setFunct,
    currentView: activeStep,
    setCurrentView: setActiveStep,
    launchingSampling: launchingSampling,
    setLaunchingSampling: setLaunchingSampling,
    runningSampling: runningSampling,
    setRunningSampling: setRunningSampling,
    selectedJobs: selectedJobs,
    setSelectedJobs: setSelectedJobs,
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
        </FakeRoot>
      </ThemeProvider>
    </MMUXContext.Provider>
  );
};

export default App;