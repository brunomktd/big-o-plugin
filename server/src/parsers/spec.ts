import type Parser from 'web-tree-sitter';
import { LoopBound } from '../ir';

export type SyntaxNode = Parser.SyntaxNode;

export interface FunctionInfo {
  name: string;
  body: SyntaxNode;
}

export type Classified =
  | { type: 'skip' }
  | { type: 'loop'; bound: LoopBound; label: string; header: SyntaxNode[]; body: SyntaxNode[] }
  | { type: 'call'; name: string; receiver?: SyntaxNode; args: SyntaxNode[]; lambdas: SyntaxNode[] };

/** Maps a tree-sitter grammar onto the language-agnostic IR. `classify` returns undefined to recurse into children. */
export interface LanguageSpec {
  functionInfo(node: SyntaxNode): FunctionInfo | undefined;
  classify(node: SyntaxNode): Classified | undefined;
}

const LOG_UPDATES = [
  /(\w+)\s*(?:\/=|\*=|>>>?=|<<=)/g,
  /(\w+)\s*=\s*(?:[\w.]+\()?\s*\1\s*(?:\/|\*|>>>?|<<|shr\b|shl\b|ushr\b)/g,
  /(\w+)\s*=\s*mid\w*/g,
];

function logVars(text: string): string[] {
  return LOG_UPDATES.flatMap((re) => [...text.matchAll(re)].map((m) => m[1]));
}

const clean = (t: string | undefined) => (t ?? '').trim().replace(/;$/, '').trim();

export function forBound(init?: string, cond?: string, update?: string): LoopBound {
  if (/=\s*-?\d+$/.test(clean(init)) && /[<>]=?\s*-?\d+$/.test(clean(cond))) return 'const';
  if (logVars(clean(update)).length) return 'log';
  return 'n';
}

export function whileBound(cond: string, body: string): LoopBound {
  return logVars(body).some((v) => new RegExp(`\\b${v}\\b`).test(cond)) ? 'log' : 'n';
}

const LITERAL_RANGE = /^\(?\s*-?\d+\s*(?:\.\.<?|until|downTo)\s*-?\d+\s*\)?(?:\s*step\s*\d+)?$/;
const LITERAL_COLLECTION = /^(?:\[[^\]]*\]|(?:listOf|arrayOf|setOf|intArrayOf|List\.of|Set\.of|Arrays\.asList)\([\w\s,'"]*\))$/;

export function iterableBound(text: string): LoopBound {
  const t = text.trim();
  return LITERAL_RANGE.test(t) || LITERAL_COLLECTION.test(t) ? 'const' : 'n';
}
