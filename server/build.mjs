import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/wasm', { recursive: true });

await build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.js',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
});

cpSync('node_modules/web-tree-sitter/tree-sitter.wasm', 'dist/tree-sitter.wasm');
for (const lang of ['javascript', 'typescript', 'tsx', 'java', 'kotlin']) {
  cpSync(`node_modules/tree-sitter-wasms/out/tree-sitter-${lang}.wasm`, `dist/wasm/tree-sitter-${lang}.wasm`);
}
