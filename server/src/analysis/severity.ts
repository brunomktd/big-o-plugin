import { Complexity, score } from './complexity';

export type Severity = 'good' | 'warn' | 'bad';

export const LEVELS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)'] as const;
export type Level = (typeof LEVELS)[number];

const LEVEL_SCORE: Record<Level, number> = {
  'O(1)': 0, 'O(log n)': 1, 'O(n)': 10, 'O(n log n)': 11, 'O(n²)': 20, 'O(n³)': 30, 'O(2ⁿ)': 1000,
};

export interface Thresholds {
  goodMax: Level;
  warnMax: Level;
}

export const DEFAULT_THRESHOLDS: Thresholds = { goodMax: 'O(n)', warnMax: 'O(n log n)' };

export const SEVERITY_ICON: Record<Severity, string> = { good: '🟢', warn: '🟡', bad: '🔴' };

export function severity(c: Complexity, t: Thresholds = DEFAULT_THRESHOLDS): Severity {
  const s = score(c);
  if (s <= LEVEL_SCORE[t.goodMax]) return 'good';
  if (s <= LEVEL_SCORE[t.warnMax]) return 'warn';
  return 'bad';
}

export function parseThresholds(raw: unknown): Thresholds {
  const r = (raw ?? {}) as Partial<Record<keyof Thresholds, string>>;
  const pick = (v: string | undefined, d: Level): Level => (LEVELS as readonly string[]).includes(v ?? '') ? (v as Level) : d;
  return { goodMax: pick(r.goodMax, DEFAULT_THRESHOLDS.goodMax), warnMax: pick(r.warnMax, DEFAULT_THRESHOLDS.warnMax) };
}
