import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { PersistenceContextProvider } from "./context/PersistenceContext";
import { NavigationContextProvider } from "./context/NavigationContext";

createRoot(document.getElementById("root")!).render(
  <PersistenceContextProvider>
    <NavigationContextProvider>
      <App />
    </NavigationContextProvider>
  </PersistenceContextProvider>,
);
