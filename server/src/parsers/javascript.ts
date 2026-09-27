import { Classified, FunctionInfo, LanguageSpec, SyntaxNode, forBound, iterableBound, whileBound } from './spec';

const FN_LITERALS = new Set(['arrow_function', 'function_expression', 'function', 'generator_function']);
const NAMED_PARENTS = new Set(['variable_declarator', 'public_field_definition', 'field_definition', 'pair']);

function info(name: string | undefined, body: SyntaxNode | null): FunctionInfo | undefined {
  return name && body ? { name, body } : undefined;
}

function literalName(node: SyntaxNode): string | undefined {
  const own = node.childForFieldName('name')?.text;
  if (own) return own;
  const p = node.parent;
  if (!p) return undefined;
  if (NAMED_PARENTS.has(p.type)) {
    return (p.childForFieldName('name') ?? p.childForFieldName('property') ?? p.childForFieldName('key'))?.text;
  }
  if (p.type === 'assignment_expression') return p.childForFieldName('left')?.text.split('.').pop();
  return undefined;
}

export const javascriptSpec: LanguageSpec = {
  functionInfo(node) {
    switch (node.type) {
      case 'function_declaration':
      case 'generator_function_declaration':
      case 'method_definition':
        return info(node.childForFieldName('name')?.text, node.childForFieldName('body'));
      default:
        return FN_LITERALS.has(node.type) ? info(literalName(node), node.childForFieldName('body')) : undefined;
    }
  },

  classify(node): Classified | undefined {
    const f = (name: string) => node.childForFieldName(name);
    switch (node.type) {
      case 'arrow_function':
      case 'function_expression':
      case 'function':
      case 'generator_function':
      case 'class_declaration':
      case 'class':
        return { type: 'skip' };
      case 'for_statement': {
        const [init, cond, upd, body] = [f('initializer'), f('condition'), f('increment'), f('body')];
        return {
          type: 'loop', label: 'for', bound: forBound(init?.text, cond?.text, upd?.text),
          header: init ? [init] : [], body: [cond, upd, body].filter((n): n is SyntaxNode => !!n),
        };
      }
      case 'for_in_statement': {
        const right = f('right');
        return {
          type: 'loop', label: 'for…of', bound: iterableBound(right?.text ?? ''),
          header: right ? [right] : [], body: f('body') ? [f('body')!] : [],
        };
      }
      case 'while_statement':
      case 'do_statement': {
        const cond = f('condition');
        const body = f('body');
        return {
          type: 'loop', label: node.type === 'while_statement' ? 'while' : 'do…while',
          bound: whileBound(cond?.text ?? '', body?.text ?? ''), header: [],
          body: [cond, body].filter((n): n is SyntaxNode => !!n),
        };
      }
      case 'call_expression': {
        const callee = f('function');
        const allArgs = f('arguments')?.namedChildren ?? [];
        const lambdas = allArgs.filter((a) => FN_LITERALS.has(a.type)).map((a) => a.childForFieldName('body')!).filter(Boolean);
        const args = allArgs.filter((a) => !FN_LITERALS.has(a.type));
        if (callee?.type === 'member_expression') {
          const name = callee.childForFieldName('property')?.text;
          if (name) return { type: 'call', name, receiver: callee.childForFieldName('object') ?? undefined, args, lambdas };
        }
        if (callee?.type === 'identifier') return { type: 'call', name: callee.text, args, lambdas };
        return undefined;
      }
      default:
        return undefined;
    }
  },
};
