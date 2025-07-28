import { useEffect, useState } from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import { Container, useColorScheme } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { setupTheme } from "./theme";
import Navigation from "./components/navigation/Navigation";
import { Footer } from "./components/navigation/Footer";
import { useNavigationContext } from "./context/NavigationContext";
import { getHealth } from "./utils/function_utils";
import { SplashScreen } from "./views/SplashScreen";
import { ServiceContextProvider } from "./context/ServiceContext";
import PreviewWarning from "./components/navigation/PreviewWarning";
import { ReturnCurrentView } from "./views/ReturnCurrentView";
import { MMUXContextProvider } from "./context/MMUXContext";
import { FunctionContextProvider } from "./context/FunctionContext";
import { SamplingContextProvider } from "./context/SamplingContext";
import { JobContextProvider } from "./context/JobContext";
import { usePersistenceContext } from "./context/PersistenceContext";

const AppRoot = styled("div")(
  ({ theme }) => `
  min-height: 100vh;
  height: 100%;
  background-color: ${theme.palette.background.default};
`
);

const App = () => {
  const [healthStatus, setHealthStatus] = useState<boolean>(false);

  const { currentView, steps } = useNavigationContext();
  const { loading } = usePersistenceContext();
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
    console.info("Setting theme mode to", newMode);
    setThemeMode(newMode);
    setMode(newMode);
  };

  const getHealthStatus = async () => {
    try {
      const responseHealth = await getHealth();
      const result = responseHealth === 200;
      console.info("Health status response:", responseHealth, result);
      if (result) {
        setHealthStatus(true);
      } else {
        setHealthStatus(false);
      }
      return result;
    } catch (error) {
      console.error("Backend is not healthy:", error);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const pollHealthStatus = async (retries: number) => {
      console.info("Fetching health status from backend...", retries);
      const result = await getHealthStatus();
      if (retries <= 0) {
        console.error("Failed to get health status after multiple attempts.");
        toast.error(
          "Failed to connect to the backend after multiple attempts. Please check the server status."
        );
        return;
      }
      if (result) return;
      if (!healthStatus) {
        timeoutId = setTimeout(pollHealthStatus, 1000, retries - 1);
      }
    };
    pollHealthStatus(30);
    return () => {
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Message handler (from parent window, when in an iframe zB.)
    const processKeyValue = (keyValue: string) => {
      const [key, value] = keyValue.split("=");
      if (key === "theme") {
        if (value.toLowerCase().includes("dark")) {
          setThemeModeHandler("dark");
        } else if (value.toLowerCase().includes("light")) {
          setThemeModeHandler("light");
        }
      }
    };
    const messageHandler = (e: MessageEvent) => {
      const msg: string = e.data;
      const OSPARC_MSG_PREFIX = "osparc;";
      if (typeof msg === "string" && msg.indexOf(OSPARC_MSG_PREFIX) === 0) {
        console.info("Received message from parent window:", e);
        const osparcMsg = msg.slice(OSPARC_MSG_PREFIX.length);
        osparcMsg.split("&").forEach(processKeyValue);
      }
    };
    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AppRoot>
        {!healthStatus || loading ? (
          <SplashScreen />
        ) : (
          <ServiceContextProvider>
            <FunctionContextProvider>
              <SamplingContextProvider>
                <JobContextProvider>
                  <MMUXContextProvider>
                    <PreviewWarning />
                    <Container sx={{ paddingBottom: 4 }}>
                      <Navigation steps={steps} activeStep={currentView} />
                      <ReturnCurrentView currentView={currentView} />
                      <Footer steps={steps} />
                    </Container>
                  </MMUXContextProvider>
                </JobContextProvider>
              </SamplingContextProvider>
            </FunctionContextProvider>
          </ServiceContextProvider>
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
      </AppRoot>
    </ThemeProvider>
  );
};

export default App;
