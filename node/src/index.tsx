import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { PersistenceContextProvider } from "./context/PersistenceContext";
import { NavigationContextProvider } from "./context/NavigationContext";
import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PersistenceContextProvider>
      <NavigationContextProvider>
        <App />
      </NavigationContextProvider>
    </PersistenceContextProvider>
  </ErrorBoundary>,
);
