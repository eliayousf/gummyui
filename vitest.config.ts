import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
    maxWorkers: 4,
    testTimeout: 20_000,
    hookTimeout: 20_000,
    teardownTimeout: 20_000,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
