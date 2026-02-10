// Vite configuration file
// ======================
// This file sets up Vite for building and running the React dashboard.
// It includes the React plugin to enable JSX, Fast Refresh, and other React-specific features.

import { defineConfig } from "vite"; // Import Vite's configuration helper
import react from "@vitejs/plugin-react"; // Import official React plugin for Vite

// Export the configuration
export default defineConfig({
  base: "./", // important for deployment on Vercel
  plugins: [
    react(), // Enables React support (JSX, Fast Refresh, etc.)
  ],
});
