import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { PersistenceContextProvider } from "./context/PersistenceContext.tsx";
import { NavigationContextProvider } from "./context/NavigationContext.tsx";

createRoot(document.getElementById("root")!).render(
  <PersistenceContextProvider>
    <NavigationContextProvider>
      <App />
    </NavigationContextProvider>
  </PersistenceContextProvider>
);
