import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Get the root DOM element where the React app will be mounted
const rootElement = document.getElementById("root");

// Create a React root for concurrent features (React 18+)
const root = createRoot(rootElement);

// Render the App component inside StrictMode for development checks
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
