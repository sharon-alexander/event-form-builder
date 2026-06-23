import React from "react";
import ReactDOM from "react-dom/client";
import AdminApp from "./AdminApp";
import "../index.css";

const container = document.getElementById("admin-root");
if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>,
  );
}
