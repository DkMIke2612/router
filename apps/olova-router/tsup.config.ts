import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    router: 'src/router.tsx',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'vite', 'path', 'fs'],
  treeshake: true,
  splitting: false,
  skipNodeModulesBundle: true,
});
