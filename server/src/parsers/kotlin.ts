import { Classified, LanguageSpec, SyntaxNode, iterableBound, whileBound } from './spec';

const DECLARATIONS = new Set(['variable_declaration', 'multi_variable_declaration', 'control_structure_body', 'annotation']);

const child = (node: SyntaxNode, type: string) => node.namedChildren.find((c) => c.type === type);

function lambdaBody(node: SyntaxNode): SyntaxNode | undefined {
  if (node.type === 'lambda_literal') return child(node, 'statements');
  if (node.type === 'anonymous_function') return child(node, 'function_body');
  return undefined;
}

function suffixParts(suffix: SyntaxNode | undefined, args: SyntaxNode[], lambdas: SyntaxNode[]): void {
  if (!suffix) return;
  for (const valueArg of child(suffix, 'value_arguments')?.namedChildren ?? []) {
    const expr = valueArg.namedChildren[valueArg.namedChildren.length - 1];
    if (!expr) continue;
    const body = lambdaBody(expr);
    if (body) lambdas.push(body);
    else if (expr.type !== 'lambda_literal' && expr.type !== 'anonymous_function') args.push(expr);
  }
  const trailing = child(suffix, 'annotated_lambda');
  const lambda = trailing && child(trailing, 'lambda_literal');
  const body = lambda && lambdaBody(lambda);
  if (body) lambdas.push(body);
}

function loopParts(node: SyntaxNode): { cond: SyntaxNode | undefined; body: SyntaxNode | undefined } {
  return {
    cond: node.namedChildren.find((c) => !DECLARATIONS.has(c.type)),
    body: child(node, 'control_structure_body'),
  };
}

export const kotlinSpec: LanguageSpec = {
  functionInfo(node) {
    if (node.type !== 'function_declaration') return undefined;
    const name = child(node, 'simple_identifier')?.text;
    const body = child(node, 'function_body');
    return name && body ? { name, body } : undefined;
  },

  classify(node): Classified | undefined {
    switch (node.type) {
      case 'lambda_literal':
      case 'anonymous_function':
      case 'class_declaration':
      case 'object_declaration':
        return { type: 'skip' };
      case 'for_statement': {
        const { cond: iterable, body } = loopParts(node);
        return {
          type: 'loop', label: 'for', bound: iterableBound(iterable?.text ?? ''),
          header: iterable ? [iterable] : [], body: body ? [body] : [],
        };
      }
      case 'while_statement':
      case 'do_while_statement': {
        const { cond, body } = loopParts(node);
        return {
          type: 'loop', label: node.type === 'while_statement' ? 'while' : 'do…while',
          bound: whileBound(cond?.text ?? '', body?.text ?? ''), header: [],
          body: [cond, body].filter((n): n is SyntaxNode => !!n),
        };
      }
      case 'call_expression': {
        let [callee, suffix] = node.namedChildren;
        const args: SyntaxNode[] = [];
        const lambdas: SyntaxNode[] = [];
        // `repeat(n) { }` parses as call(call(repeat, (n)), { }): fold the trailing lambda into the inner call.
        if (callee?.type === 'call_expression' && suffix && !child(suffix, 'value_arguments')) {
          suffixParts(suffix, args, lambdas);
          [callee, suffix] = callee.namedChildren;
        }
        suffixParts(suffix, args, lambdas);
        if (callee?.type === 'simple_identifier') return { type: 'call', name: callee.text, args, lambdas };
        if (callee?.type === 'navigation_expression') {
          const navSuffix = child(callee, 'navigation_suffix');
          const name = navSuffix && child(navSuffix, 'simple_identifier')?.text;
          if (name) return { type: 'call', name, receiver: callee.namedChildren[0], args, lambdas };
        }
        return undefined;
      }
      default:
        return undefined;
    }
  },
};
