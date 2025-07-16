import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { MMUXContextProvider } from "./context/MMUXContext.tsx";
import { PersistenceContextProvider } from "./context/PersistenceContext.tsx";

createRoot(document.getElementById("root")!).render(
  <PersistenceContextProvider>
    <MMUXContextProvider>
      <App />
    </MMUXContextProvider>
  </PersistenceContextProvider>
);
