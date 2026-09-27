import { FunctionIR, IRNode } from '../ir';
import { ITERATION_METHODS } from '../analysis/knownCosts';
import { LanguageSpec, SyntaxNode, iterableBound } from './spec';

const SELF_RECEIVER = /^(this|self)$/;
const HALVED_ARGS = /\/\s*2\b|>>>?\s*1\b|\b(?:shr|ushr)\s+1\b|\bmid\w*|\bmiddle\b|\bhalf\b|\bpivot\w*|\bpi\b|\bpartition\w*/i;
const MEMOIZATION = /\b(?:memo|cache|visited|seen|dp)\w*/i;

const CONDITIONALS = new Set([
  'if_statement', 'ternary_expression', 'conditional_expression', 'if_expression', 'when_expression',
]);

interface Ctx {
  fnName: string;
  spec: LanguageSpec;
  branches: string[];
}

function convertAll(nodes: SyntaxNode[], ctx: Ctx): IRNode[] {
  return nodes.flatMap((n) => convert(n, ctx));
}

function isReturn(node: SyntaxNode): boolean {
  return node.type === 'return_statement' || (node.type === 'jump_expression' && node.text.startsWith('return'));
}

function convertBranching(node: SyntaxNode, ctx: Ctx): IRNode[] | undefined {
  if (isReturn(node)) {
    return convertAll(node.namedChildren, { ...ctx, branches: [...ctx.branches, `return:${node.id}`] });
  }
  if (!CONDITIONALS.has(node.type)) return undefined;
  const children = node.namedChildren;
  const cond = node.childForFieldName('condition') ?? (['if_expression', 'when_expression'].includes(node.type) && children[0].type !== 'when_entry' ? children[0] : null);
  const arms = children.filter((c) => c.id !== cond?.id);
  return [
    ...(cond ? convert(cond, ctx) : []),
    ...arms.flatMap((arm, i) => convert(arm, { ...ctx, branches: [...ctx.branches, `${node.id}:${i}`] })),
  ];
}

function convert(node: SyntaxNode, ctx: Ctx): IRNode[] {
  if (ctx.spec.functionInfo(node)) return [];
  const k = ctx.spec.classify(node);
  if (!k) return convertBranching(node, ctx) ?? convertAll(node.namedChildren, ctx);
  const line = node.startPosition.row;

  switch (k.type) {
    case 'skip':
      return [];
    case 'loop':
      return [...convertAll(k.header, ctx), { kind: 'loop', bound: k.bound, label: k.label, line, body: convertAll(k.body, ctx) }];
    case 'call': {
      const receiver = k.receiver?.text;
      const pre = [...(k.receiver ? convert(k.receiver, ctx) : []), ...convertAll(k.args, ctx)];
      const lambdaBody = convertAll(k.lambdas, ctx);
      const recursive = k.name === ctx.fnName && (!receiver || SELF_RECEIVER.test(receiver));

      if (!recursive && receiver && ITERATION_METHODS.has(k.name) && k.args.length + k.lambdas.length > 0) {
        return [...pre, { kind: 'loop', bound: iterableBound(receiver), label: `.${k.name}()`, line, body: lambdaBody }];
      }
      if (!recursive && !receiver && k.name === 'repeat' && k.lambdas.length > 0) {
        const bound = /^\d+$/.test(k.args[0]?.text ?? '') ? 'const' : 'n';
        return [...pre, { kind: 'loop', bound, label: 'repeat()', line, body: lambdaBody }];
      }
      const halved = recursive && HALVED_ARGS.test(k.args.map((a) => a.text).join(','));
      return [...pre, ...lambdaBody, { kind: 'call', name: k.name, receiver, line, recursive, halved, branches: ctx.branches }];
    }
  }
}

export function extractFunctions(root: SyntaxNode, spec: LanguageSpec): FunctionIR[] {
  const out: FunctionIR[] = [];
  const visit = (node: SyntaxNode) => {
    const info = spec.functionInfo(node);
    if (info) {
      out.push({
        name: info.name,
        line: node.startPosition.row,
        character: node.startPosition.column,
        body: convert(info.body, { fnName: info.name, spec, branches: [] }),
        memoized: MEMOIZATION.test(info.body.text),
      });
    }
    for (const child of node.namedChildren) visit(child);
  };
  visit(root);
  return out;
}
