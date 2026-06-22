#!/usr/bin/env node
/**
 * Build script using esbuild — no native binaries, works everywhere.
 * Generates ESM + CJS + DTS.
 */

import * as esbuild from 'esbuild';

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  treeShaking: true,
  banner: {
    js: '// Flowgate Automation — https://github.com/lucasdaniel2201/flowgate-automation',
  },
  external: ['pino', 'zod'],
};

// ESM build
await esbuild.build({
  ...baseConfig,
  outfile: 'dist/index.js',
  format: 'esm',
  outExtension: { '.js': '.js' },
});

// CJS build
await esbuild.build({
  ...baseConfig,
  outfile: 'dist/index.cjs',
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
});

console.log('✅ Build complete: ESM + CJS');
