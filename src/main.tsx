import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyTheme, getStoredTheme } from "./themes/applyTheme";
import { applyZoom } from "./hooks/useGlobalZoom";
import { useEditorStore } from "./store/editorStore";

// Second guarantee against a theme flash: the inline script in index.html
// normally wins the race, but this also covers HMR and embedded webviews.
applyTheme(getStoredTheme());

// Apply the remembered interface zoom before the first React paint.
applyZoom(useEditorStore.getState().settings.zoom);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
