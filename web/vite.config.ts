import { defineConfig } from "vite";
import { resolve } from "node:path";

// base relativa: la presentación se puede abrir desde una carpeta local o un servidor estático
export default defineConfig({
  base: "./",
  server: { port: 5180, host: "127.0.0.1" },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: resolve(__dirname, "index.html"), presenter: resolve(__dirname, "presenter.html"), acerca: resolve(__dirname, "acerca.html"), mobileQr: resolve(__dirname, "mobile-qr.html") } },
  },
});
