import { defineConfig } from 'tsup'

export default defineConfig({
  noExternal: ["@pooltogether/v5-autotasks-library"],
  format: 'cjs',
  shims: true,
  entry: ['src/handler.ts'],
  splitting: false,
  clean: true,
})