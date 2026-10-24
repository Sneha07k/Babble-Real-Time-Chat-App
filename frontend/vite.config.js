import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// override with BACKEND_URL if the backend runs on another port
const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react()],

  // the components are .js files that contain JSX
  esbuild: { loader: "jsx", include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { ".js": "jsx" } } },

  server: {
    port: 3000,
    // the browser talks only to :3000; API calls and the live socket go to the backend
    proxy: {
      "/api": BACKEND,
      "/socket.io": { target: BACKEND, ws: true },
    },
  },

  // the backend serves frontend/build in production
  build: { outDir: "build" },
});
