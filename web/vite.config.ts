import { defineConfig } from "vite";

// base relativa: la presentación se puede abrir desde una carpeta local o un servidor estático
export default defineConfig({
  base: "./",
  server: { port: 5180, host: "127.0.0.1" },
  build: { target: "es2022", chunkSizeWarningLimit: 1200 },
});
