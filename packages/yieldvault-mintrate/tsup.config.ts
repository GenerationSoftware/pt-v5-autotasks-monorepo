import { defineConfig } from "tsup";

export default defineConfig({
  noExternal: ["@pooltogether/v5-autotasks-library", "ethereum-multicall"],
  format: "cjs",
  entry: ["src/handler.ts"],
  splitting: false,
  clean: true,
});
