import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const MOUNT_ID = "roscioli-event-form";

function mount() {
  const container = document.getElementById(MOUNT_ID);
  if (!container) return;
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
