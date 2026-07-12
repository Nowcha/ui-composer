import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { useSpecStore } from "./store/spec-store";
import { initPersistence, loadPersistedDocument } from "./store/persistence";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root element not found");
}

// Restore the last session before first render, then start autosaving
const persisted = loadPersistedDocument();
if (persisted) {
  useSpecStore.getState().loadDocument(persisted);
}
initPersistence();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
