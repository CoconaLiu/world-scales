import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "world-scales";
const requestedBasePath = process.env.PAGES_BASE_PATH ?? `/${repositoryName}/`;
const normalizedBasePath = requestedBasePath.trim().replace(/^\/+|\/+$/g, "");
const basePath = normalizedBasePath ? `/${normalizedBasePath}/` : "/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
  },
});
