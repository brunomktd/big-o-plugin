import { CallNode, FunctionIR, IRNode, LoopBound } from '../ir';
import { Complexity, O1, OEXP, OFACT, OLOG, ON, ONLOGN, label, max, mul, score } from './complexity';
import { callCost } from './knownCosts';

export interface Estimate {
  complexity: Complexity;
  reasons: string[];
}

/** Looks up the estimated cost of another function declared in the same file. */
export type Resolver = (name: string) => Complexity | undefined;

const BOUND_COST: Record<LoopBound, Complexity> = { n: ON, log: OLOG, const: O1 };
const BOUND_DESC: Record<LoopBound, string> = { n: 'O(n)', log: 'O(log n), a variável dobra/divide', const: 'nº fixo de iterações' };
const CONSTANT: Estimate = { complexity: O1, reasons: [] };

function evalSeq(nodes: IRNode[], resolve: Resolver): Estimate {
  let best = CONSTANT;
  for (const node of nodes) {
    const e = evalNode(node, resolve);
    if (score(e.complexity) > score(best.complexity)) best = e;
  }
  return best;
}

function evalNode(node: IRNode, resolve: Resolver): Estimate {
  if (node.kind === 'loop') {
    const inner = evalSeq(node.body, resolve);
    if (node.bound === 'const') return inner;
    return {
      complexity: mul(BOUND_COST[node.bound], inner.complexity),
      reasons: [`linha ${node.line + 1}: ${node.label} — ${BOUND_DESC[node.bound]}`, ...inner.reasons],
    };
  }
  if (node.recursive) return CONSTANT;
  const known = callCost(node.name, node.receiver);
  if (known) {
    if (score(known.cost) === 0) return CONSTANT;
    return {
      complexity: known.cost,
      reasons: [`linha ${node.line + 1}: .${node.name}() — ${label(known.cost)} (${known.reason})`],
    };
  }
  const local = !node.receiver || node.receiver === 'this' ? resolve(node.name) : undefined;
  if (!local || score(local) === 0) return CONSTANT;
  return { complexity: local, reasons: [`linha ${node.line + 1}: chama ${node.name}() — ${label(local)}`] };
}

function exclusive(a: CallNode, b: CallNode): boolean {
  const arms = new Map(a.branches.map((s) => [s.slice(0, s.lastIndexOf(':')), s]));
  return b.branches.some((s) => {
    const other = arms.get(s.slice(0, s.lastIndexOf(':')));
    return other !== undefined && other !== s;
  });
}

/** Largest number of recursive calls that can run in the same invocation (ignores mutually exclusive branches). */
function branchingFactor(calls: CallNode[]): number {
  if (calls.length > 12) return calls.length;
  let best = 0;
  for (let mask = 1; mask < 1 << calls.length; mask++) {
    const picked = calls.filter((_, i) => mask & (1 << i));
    if (picked.length <= best) continue;
    if (picked.every((a, i) => picked.slice(i + 1).every((b) => !exclusive(a, b)))) best = picked.length;
  }
  return best;
}

function collectRecursive(nodes: IRNode[], inLoop: boolean, out: { call: CallNode; inLoop: boolean }[]): void {
  for (const node of nodes) {
    if (node.kind === 'loop') collectRecursive(node.body, inLoop || node.bound === 'n', out);
    else if (node.recursive) out.push({ call: node, inLoop });
  }
}

export function estimate(fn: FunctionIR, resolve: Resolver = () => undefined): Estimate {
  const base = evalSeq(fn.body, resolve);
  const recursive: { call: CallNode; inLoop: boolean }[] = [];
  collectRecursive(fn.body, false, recursive);
  if (recursive.length === 0) return base;

  const halved = recursive.some((r) => r.call.halved);
  const lines = recursive.map((r) => r.call.line + 1).join(', ');
  const withReason = (complexity: Complexity, reason: string): Estimate => ({
    complexity,
    reasons: [`${reason} (linha ${lines})`, ...base.reasons],
  });

  if (fn.memoized) {
    return withReason(mul(ON, base.complexity), 'recursão com memoização/visitados: cada estado é resolvido uma vez');
  }
  if (!halved && recursive.some((r) => r.inLoop)) {
    return withReason(OFACT, 'recursão dentro de loop (gera permutações/combinações)');
  }
  const factor = branchingFactor(recursive.map((r) => r.call));
  if (factor === 1) {
    if (halved) {
      return base.complexity.poly >= 1
        ? withReason(base.complexity, 'recursão que divide a entrada ao meio')
        : withReason(mul(OLOG, base.complexity), 'recursão que divide a entrada ao meio');
    }
    return withReason(mul(ON, base.complexity), 'recursão linear (entrada diminui a cada chamada)');
  }
  if (halved) {
    const b = base.complexity;
    const result = b.poly === 0 ? ON : b.poly === 1 && b.log === 0 ? ONLOGN : b;
    return withReason(max(result, b), 'divisão e conquista (múltiplas chamadas sobre metades)');
  }
  return withReason(OEXP, `${factor} chamadas recursivas por execução, sem memoização`);
}
