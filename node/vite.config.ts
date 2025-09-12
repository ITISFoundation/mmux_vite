import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteconfigtspaths from "vite-tsconfig-paths";
// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), viteconfigtspaths()],
  preview: {
    port: 8080,
    strictPort: true,
  },
  server: {
    port: 8080,
    strictPort: true,
    host: "0.0.0.0",
    origin: "http://0.0.0.0:8080",
    allowedHosts: true,
  },
});
