import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { analyze, languageForPath } from '../src/analyze';
import { label } from '../src/analysis/complexity';

const SAMPLES = path.join(__dirname, '..', '..', 'docs', 'samples');

for (const file of fs.readdirSync(SAMPLES)) {
  describe(file, async () => {
    const source = fs.readFileSync(path.join(SAMPLES, file), 'utf8');
    const lines = source.split(/\r?\n/);
    const reports = await analyze(source, languageForPath(file)!);

    it('reports every annotated function', () => {
      const annotated = lines.filter((l) => /^\s*\/\/ @bigO /.test(l)).length;
      expect(reports.filter((r) => /@bigO/.test(lines[r.line - 1] ?? ''))).toHaveLength(annotated);
    });

    for (const r of reports) {
      const expected = /\/\/ @bigO (.+)$/.exec(lines[r.line - 1] ?? '')?.[1].trim();
      if (!expected) continue;
      it(`${r.name} is ${expected}`, () => {
        expect(label(r.complexity), r.reasons.join('\n')).toBe(expected);
      });
    }
  });
}
