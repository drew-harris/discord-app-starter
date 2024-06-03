import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import devServer from "@hono/vite-dev-server";

export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      plugins: [react()],
      build: {
        rollupOptions: {
          input: ["src/client/client.tsx"],
          output: {
            entryFileNames: "static/client.js",
            chunkFileNames: "static/assets/[name]-[hash].js",
            assetFileNames: "static/assets/[name].[ext]",
          },
        },
        emptyOutDir: false,
        copyPublicDir: false,
      },
    };
  } else {
    return {
      build: {
        minify: true,
        rollupOptions: {
          output: {
            entryFileNames: "server.js",
          },
        },
      },
      plugins: [
        devServer({
          entry: "src/server/index.ts",
        }),
      ],
    };
  }
});
