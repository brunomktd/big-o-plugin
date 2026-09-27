import * as fs from 'fs';
import * as path from 'path';
import Parser from 'web-tree-sitter';
import { Estimate, estimate } from './analysis/heuristics';
import { FunctionIR } from './ir';
import { extractFunctions } from './parsers/converter';
import { javaSpec } from './parsers/java';
import { javascriptSpec } from './parsers/javascript';
import { kotlinSpec } from './parsers/kotlin';
import { LanguageSpec } from './parsers/spec';

export type LanguageKey = 'javascript' | 'typescript' | 'tsx' | 'java' | 'kotlin';

const SPECS: Record<LanguageKey, LanguageSpec> = {
  javascript: javascriptSpec,
  typescript: javascriptSpec,
  tsx: javascriptSpec,
  java: javaSpec,
  kotlin: kotlinSpec,
};

const EXTENSIONS: Record<string, LanguageKey> = {
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.ts': 'typescript', '.mts': 'typescript', '.cts': 'typescript', '.tsx': 'tsx',
  '.java': 'java', '.kt': 'kotlin', '.kts': 'kotlin',
};

export function languageForPath(filePath: string): LanguageKey | undefined {
  return EXTENSIONS[path.extname(filePath).toLowerCase()];
}

function wasmPath(key: LanguageKey): string {
  const file = `tree-sitter-${key}.wasm`;
  const bundled = path.join(__dirname, 'wasm', file);
  return fs.existsSync(bundled) ? bundled : path.join(__dirname, '..', 'node_modules', 'tree-sitter-wasms', 'out', file);
}

let init: Promise<void> | undefined;
const parsers = new Map<LanguageKey, Promise<Parser>>();

function parserFor(key: LanguageKey): Promise<Parser> {
  let p = parsers.get(key);
  if (!p) {
    init ??= Parser.init();
    p = init.then(async () => {
      const parser = new Parser();
      parser.setLanguage(await Parser.Language.load(wasmPath(key)));
      return parser;
    });
    parsers.set(key, p);
  }
  return p;
}

export interface FunctionReport extends Estimate {
  name: string;
  line: number;
  character: number;
}

export async function analyze(source: string, key: LanguageKey): Promise<FunctionReport[]> {
  const tree = (await parserFor(key)).parse(source);
  try {
    const functions = extractFunctions(tree.rootNode, SPECS[key]);
    const byName = new Map<string, FunctionIR>();
    for (const fn of functions) if (!byName.has(fn.name)) byName.set(fn.name, fn);

    const cache = new Map<FunctionIR, Estimate>();
    const inProgress = new Set<FunctionIR>();
    const run = (fn: FunctionIR): Estimate => {
      let e = cache.get(fn);
      if (!e) {
        inProgress.add(fn);
        e = estimate(fn, (name) => {
          const callee = byName.get(name);
          return callee && !inProgress.has(callee) ? run(callee).complexity : undefined;
        });
        inProgress.delete(fn);
        cache.set(fn, e);
      }
      return e;
    };
    return functions.map((fn) => ({ name: fn.name, line: fn.line, character: fn.character, ...run(fn) }));
  } finally {
    tree.delete();
  }
}
