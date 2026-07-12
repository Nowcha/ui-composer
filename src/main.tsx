import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { useSpecStore } from "./store/spec-store";
import { initPersistence, loadPersistedDocument } from "./store/persistence";
import { consumeSharedDocumentFromUrl } from "./store/url-share";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root element not found");
}

// Priority: shared URL > last session in localStorage. Then autosave.
const shared = consumeSharedDocumentFromUrl();
const persisted = shared ?? loadPersistedDocument();
if (persisted) {
  useSpecStore.getState().loadDocument(persisted);
}
initPersistence();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
