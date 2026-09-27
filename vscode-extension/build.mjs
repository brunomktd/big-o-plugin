import { build } from 'esbuild';
import { cpSync, rmSync } from 'fs';

rmSync('dist', { recursive: true, force: true });
await build({
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
});
cpSync('../server/dist', 'dist/server', { recursive: true });
