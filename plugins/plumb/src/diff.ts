import type { ChangeSpec } from '@codemirror/state';
import diff from 'fast-diff';

interface DiffResult {
  changes: ChangeSpec[];
  changedLines: number;
}

function countNewlines(s: string): number {
  return s.split('\n').length - 1;
}

function markLines(text: string, startLine: number, set: Set<number>): void {
  if (text.length === 0) return;
  const n = countNewlines(text);
  const endLine = text.endsWith('\n') ? startLine + n - 1 : startLine + n;
  for (let l = startLine; l <= endLine; l++) set.add(l);
}

export function computeDiff(source: string, formatted: string, pos: number): DiffResult {
  const changes: ChangeSpec[] = [];
  const changedLineSet = new Set<number>();
  let lineNum = 0;

  const diffs = diff(source, formatted);

  for (const [op, text] of diffs) {
    switch (op) {
      case diff.EQUAL: {
        pos += text.length;
        lineNum += countNewlines(text);
        break;
      }
      case diff.INSERT: {
        changes.push({ from: pos, insert: text });
        markLines(text, lineNum, changedLineSet);
        lineNum += countNewlines(text);
        break;
      }
      case diff.DELETE: {
        changes.push({ from: pos, to: pos + text.length });
        pos += text.length;
        markLines(text, lineNum, changedLineSet);
        lineNum += countNewlines(text);
        break;
      }
    }
  }

  return { changes, changedLines: changedLineSet.size };
}
