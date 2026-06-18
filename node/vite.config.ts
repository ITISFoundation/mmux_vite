import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteconfigtspaths from "vite-tsconfig-paths";

// e2e (§T10): when set, vite proxies the `/flask/*` split to the live backend,
// replicating the Caddy proxy locally without docker. Unset in normal dev.
const e2eBackendProxy = process.env.E2E_BACKEND_PROXY;
const flaskProxy = e2eBackendProxy
  ? { "/flask": { target: e2eBackendProxy, changeOrigin: true } }
  : undefined;

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), viteconfigtspaths()],
  preview: {
    port: 8080,
    strictPort: true,
    proxy: flaskProxy,
  },
  server: {
    port: 8080,
    strictPort: true,
    host: "0.0.0.0",
    origin: "http://0.0.0.0:8080",
    allowedHosts: true,
    proxy: flaskProxy,
  },
});
