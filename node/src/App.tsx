import { useEffect, useState } from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import {
  Card,
  CardHeader,
  CircularProgress,
  Container,
  Typography,
  useColorScheme,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { setupTheme } from "./theme";
import Navigation from "./components/Navigation";
import { Footer } from "./components/Footer";
import { useMMUXContext } from "./context/MMUXContext";
import Setup from "./views/Setup";
import JobSetup from "./views/JobSetup";
import SuMoBuildingValidation from "./views/SuMoBuilding";
import UQ from "./views/UQ";
import { delay, getHealth } from "./utils/function_utils";

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

  const getHealthStatus = async () => {
    try {
      const responseHealth = await getHealth();
      if (responseHealth === 200) {
        setHealthStatus(true);
      } else {
        setHealthStatus(false);
      }
    } catch (error) {
      console.error("Backend is not healthy:", error);
      toast.error("Backend is not healthy. Please check the server status.");
    }
  };

  useEffect(() => {
    (async () => {
      while (healthStatus === false) {
        console.log("Fetching health status from backend...");
        getHealthStatus();
        await delay(1000);
      }
    })();
  }, []);

  if (healthStatus === false) {
    // loading splash screen with spinner
    return (
      <ThemeProvider theme={theme}>
      <FakeRoot>
        <Container
          style={{
            height: "100vh",
            textAlign: "center",
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          <Card
            className="spinner"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "16px",
              padding: "2rem",
              height: "20vh",
              margin: 'auto',
            }}
          >
            <Typography variant="h3" fontFamily={'inherit'} fontWeight={'100'} gutterBottom>
              MetaModelingUX
            </Typography>
            <CircularProgress size="3rem" />
            <CardHeader
              title={
                <Typography variant="body1" fontFamily={'inherit'} fontWeight={'200'}>
                  Waiting for backend
                </Typography>
              }
              style={{ textAlign: "center" }}
            />
          </Card>
        </Container>
      </FakeRoot>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <FakeRoot>
        <Container>
          <Navigation steps={steps} activeStep={currentView} />
          <>
            {currentView === 0 ? <Setup /> : undefined}
            {currentView === 1 ? <JobSetup /> : undefined}
            {currentView === 2 ? <SuMoBuildingValidation /> : undefined}
            {currentView === 3 ? <UQ /> : undefined}
          </>
          <Footer
            mode={themeMode}
            setMode={setThemeModeHandler}
            activeStep={currentView}
            setActiveStep={setCurrentView}
          />
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
