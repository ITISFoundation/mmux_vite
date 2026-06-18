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

// Dedicated e2e web port (avoids clashing with a running docker stack on 8080).
const webPort = process.env.E2E_WEB_PORT ? Number(process.env.E2E_WEB_PORT) : 8080;

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), viteconfigtspaths()],
  preview: {
    port: webPort,
    strictPort: true,
    proxy: flaskProxy,
  },
  server: {
    port: webPort,
    strictPort: true,
    host: "0.0.0.0",
    origin: `http://0.0.0.0:${webPort}`,
    allowedHosts: true,
    proxy: flaskProxy,
  },
});
