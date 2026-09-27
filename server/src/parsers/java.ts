import { Classified, LanguageSpec, SyntaxNode, forBound, iterableBound, whileBound } from './spec';

const present = (n: SyntaxNode | null): n is SyntaxNode => !!n;

export const javaSpec: LanguageSpec = {
  functionInfo(node) {
    if (node.type !== 'method_declaration' && node.type !== 'constructor_declaration') return undefined;
    const name = node.childForFieldName('name')?.text;
    const body = node.childForFieldName('body');
    return name && body ? { name, body } : undefined;
  },

  classify(node): Classified | undefined {
    const f = (name: string) => node.childForFieldName(name);
    switch (node.type) {
      case 'lambda_expression':
      case 'class_declaration':
        return { type: 'skip' };
      case 'for_statement': {
        const [init, cond, upd] = [f('init'), f('condition'), f('update')];
        return {
          type: 'loop', label: 'for', bound: forBound(init?.text, cond?.text, upd?.text),
          header: init ? [init] : [], body: [cond, upd, f('body')].filter(present),
        };
      }
      case 'enhanced_for_statement': {
        const value = f('value');
        return {
          type: 'loop', label: 'for-each', bound: iterableBound(value?.text ?? ''),
          header: value ? [value] : [], body: [f('body')].filter(present),
        };
      }
      case 'while_statement':
      case 'do_statement': {
        const cond = f('condition');
        const body = f('body');
        return {
          type: 'loop', label: node.type === 'while_statement' ? 'while' : 'do…while',
          bound: whileBound(cond?.text ?? '', body?.text ?? ''), header: [], body: [cond, body].filter(present),
        };
      }
      case 'method_invocation': {
        const name = f('name')?.text;
        if (!name) return undefined;
        const allArgs = f('arguments')?.namedChildren ?? [];
        return {
          type: 'call', name, receiver: f('object') ?? undefined,
          args: allArgs.filter((a) => a.type !== 'lambda_expression'),
          lambdas: allArgs.filter((a) => a.type === 'lambda_expression').map((a) => a.childForFieldName('body')).filter(present),
        };
      }
      default:
        return undefined;
    }
  },
};
