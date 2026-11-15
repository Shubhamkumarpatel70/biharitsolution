import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      "process.env.REACT_APP_API_URL": JSON.stringify(
        env.VITE_API_URL || env.REACT_APP_API_URL || ""
      )
    },
    esbuild: {
      loader: "jsx",
      include: /src.*\.js$/
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": "http://localhost:5000",
        "/socket.io": {
          target: "http://localhost:5000",
          ws: true
        }
      }
    },
    build: {
      outDir: "build",
      emptyOutDir: true
    }
  };
});
