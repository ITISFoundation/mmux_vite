import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { MMUXContextProvider } from "./context/MMUXContext.tsx";

createRoot(document.getElementById("root")!).render(
  <MMUXContextProvider>
    <App />
  </MMUXContextProvider>
);
