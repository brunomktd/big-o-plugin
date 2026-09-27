export interface Complexity {
  poly: number;
  log: number;
  exp?: 'exp' | 'fact';
}

export const O1: Complexity = { poly: 0, log: 0 };
export const OLOG: Complexity = { poly: 0, log: 1 };
export const ON: Complexity = { poly: 1, log: 0 };
export const ONLOGN: Complexity = { poly: 1, log: 1 };
export const OEXP: Complexity = { poly: 0, log: 0, exp: 'exp' };
export const OFACT: Complexity = { poly: 0, log: 0, exp: 'fact' };

export function score(c: Complexity): number {
  if (c.exp === 'fact') return 2000;
  if (c.exp === 'exp') return 1000;
  return c.poly * 10 + c.log;
}

export function max(a: Complexity, b: Complexity): Complexity {
  return score(b) > score(a) ? b : a;
}

export function mul(a: Complexity, b: Complexity): Complexity {
  if (a.exp || b.exp) return max(a, b);
  return { poly: a.poly + b.poly, log: a.log + b.log };
}

const SUPERSCRIPT: Record<number, string> = { 2: '²', 3: '³' };

function power(base: string, k: number): string {
  if (k === 1) return base;
  return SUPERSCRIPT[k] ? `${base}${SUPERSCRIPT[k]}` : `${base}^${k}`;
}

export function label(c: Complexity): string {
  if (c.exp === 'fact') return 'O(n!)';
  if (c.exp === 'exp') return 'O(2ⁿ)';
  const parts: string[] = [];
  if (c.poly > 0) parts.push(power('n', c.poly));
  if (c.log > 0) parts.push(c.log === 1 ? 'log n' : `log${SUPERSCRIPT[c.log] ?? '^' + c.log} n`);
  return `O(${parts.length ? parts.join(' ') : '1'})`;
}

export function describe(c: Complexity): string {
  if (c.exp === 'fact') return 'fatorial';
  if (c.exp === 'exp') return 'exponencial';
  if (c.poly === 0) return c.log === 0 ? 'constante' : 'logarítmica';
  if (c.poly === 1) return c.log === 0 ? 'linear' : 'linearítmica';
  if (c.poly === 2 && c.log === 0) return 'quadrática';
  if (c.poly === 3 && c.log === 0) return 'cúbica';
  return 'polinomial';
}
