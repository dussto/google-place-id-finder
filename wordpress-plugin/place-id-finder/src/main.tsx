
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Find the container element
  const container = document.getElementById("place-id-finder-root");
  
  // Only initialize if the container exists
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
});
