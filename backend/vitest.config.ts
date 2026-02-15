import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@backend": path.resolve(__dirname, "../apps/backend"),
    },
  },
});
