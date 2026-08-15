import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { migrateFromLocalStorage } from "./utils/idb.js";

// Fire-and-forget IndexedDB migration
migrateFromLocalStorage();

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
