import { useState } from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import { Container, useColorScheme } from "@mui/material";
import { ToastContainer } from 'react-toastify';
import { setupTheme } from "./theme";
import Navigation from "./components/Navigation";
import { Footer } from "./components/Footer";
import { useMMUXContext } from "./context/MMUXContext";
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
  const { currentView, setCurrentView } = useMMUXContext();
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



  return (
    <ThemeProvider theme={theme}>
      <FakeRoot>
        <Container>
          <Navigation
            steps={steps}
            activeStep={currentView}
          />
          <>
            {currentView === 0 ? <Setup /> : undefined}
            {currentView === 1 ? <JobSetup /> : undefined}
            {currentView === 2 ? <SuMoBuildingValidation /> : undefined}
            {currentView === 3 ? <UQ /> : undefined}
          </>
          <Footer mode={themeMode} setMode={setThemeModeHandler} activeStep={currentView} setActiveStep={setCurrentView} />
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
  );
};

export default App;