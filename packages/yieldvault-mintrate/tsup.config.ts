import { defineConfig } from 'tsup';

export default defineConfig((opt) => {
  return {
    esbuildOptions: (options, context) => {
      const CHAIN_ID = process.env.CHAIN_ID;
      if (!CHAIN_ID)
        throw new Error(
          'Missing chain configuration! Try running `yarn start` first to set the config.',
        );
      options.define = {
        ...(options.define ?? {}),
        BUILD_CHAIN_ID: `'${CHAIN_ID}'`,
      };
    },
    noExternal: [
      '@generationsoftware/pt-v5-autotasks-library',
      '@generationsoftware/pt-v5-utils-js',
      'ethers-multicall-provider',
    ],
    format: 'cjs',
    entry: ['src/handler.ts'],
    splitting: false,
    clean: true,
    minify: true,
  };
});
