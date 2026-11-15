import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: { host: "0.0.0.0", port: 3000, strictPort: true, proxy: { "/api": "http://localhost:5000" } },
    preview: { host: "0.0.0.0", port: 4173 },
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.REACT_APP_API_URL": JSON.stringify(env.VITE_API_URL || "")
    },
    build: { outDir: "dist", sourcemap: false, emptyOutDir: true }
  };
});
