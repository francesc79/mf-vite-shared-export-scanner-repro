import path from 'node:path';
import { federation } from '@module-federation/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const baseline = mode.startsWith('baseline-');
  const scenario = baseline ? mode.slice('baseline-'.length) : mode;
  if (!['template', 'control'].includes(scenario)) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }
  const entry = path.resolve(import.meta.dirname, `src/${scenario}.js`);

  return {
    base: './',
    plugins: baseline ? [] : [federation({
      name: 'reproApp',
      filename: 'remoteEntry.js',
      manifest: false,
      dts: false,
      exposes: {},
      remotes: {},
      shared: { [`shared-demo/${scenario}`]: { singleton: true } },
    })],
    build: {
      target: 'esnext',
      outDir: `dist/${mode}`,
      rollupOptions: { input: entry },
    },
  };
});
