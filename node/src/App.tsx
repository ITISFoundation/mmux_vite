import { useEffect, useState } from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import { Container, useColorScheme } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { setupTheme } from "./theme";
import Navigation from "./components/Navigation";
import { Footer } from "./components/Footer";
import { useMMUXContext } from "./context/MMUXContext";
import Setup from "./views/Setup";
import JobSetup from "./views/JobSetup";
import SuMoBuildingValidation from "./views/SuMoBuilding";
import UQ from "./views/UQ";
import { getHealth } from "./utils/function_utils";
import { SplashScreen } from "./views/SplashScreen";

const FakeRoot = styled("div")(
  ({ theme }) => `
  min-height: 100vh;
  height: 100%;
  background-color: ${theme.palette.background.default};
`
);

const App = () => {
  const [healthStatus, setHealthStatus] = useState<boolean>(false);
  const steps: Step[] = [
    { id: 0, label: "Setup" },
    { id: 1, label: "UQ" },
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

  const getHealthStatus = async () => {
    try {
      const responseHealth = await getHealth();
      const result = responseHealth === 200;
      console.log("Health status response:", responseHealth, result);
      if (result) {
        setHealthStatus(true);
      } else {
        setHealthStatus(false);
      }
      return result;
    } catch (error) {
      console.error("Backend is not healthy:", error);
      toast.error("Backend is not healthy. Please check the server status.");
    }
  };

  useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  const pollHealthStatus = async (retries: number) => {
    console.log("Fetching health status from backend...", retries);
    const result = await getHealthStatus();
    if(retries <= 0) {
      console.error("Failed to get health status after multiple attempts.");
      toast.error("Failed to connect to the backend after multiple attempts. Please check the server status.");
      return;
    }
    if(result) return;
    if (!healthStatus) {
      timeoutId = setTimeout(pollHealthStatus, 1000, retries - 1);
    }
  };
  pollHealthStatus(30);
  return () => {
    clearTimeout(timeoutId);
  };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <FakeRoot>
        {!healthStatus ? (
          <SplashScreen />
        ) : (
          <Container>
            <Navigation steps={steps} activeStep={currentView} />
            <>
              {currentView === 0 ? <Setup /> : undefined}
              {currentView === 1 ? <UQ /> : undefined}
            </>
            <Footer
              mode={themeMode}
              setMode={setThemeModeHandler}
              activeStep={currentView}
              setActiveStep={setCurrentView}
            />
          </Container>
        )}
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
