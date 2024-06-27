import { defineConfig } from "vite";
import { resolve } from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "three-view-cube",
      fileName: "three-view-cube",
    },
    rollupOptions: {
      external: ["three", "@types/three", "camera-controls"],
    },
  },
  server: {
    fs: {
      deny: [".env", ".env.*", "*.{crt,pem}", ".git"],
    },
  },
  plugins: [
    cssInjectedByJsPlugin(),
    dts({
      insertTypesEntry: true,
      exclude: "src",
    }),
  ],
});
