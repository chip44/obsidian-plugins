import type { ChangeSpec } from '@codemirror/state';
import diff from 'fast-diff';

interface DiffResult {
  changes: ChangeSpec[];
  changedLines: number;
}

const countLines = (text: string): number => {
  const lines = text.split('\n');
  // a trailing empty string from split means the text ended with \n, so the last "line" is empty and shouldn't be counted
  return lines.at(-1) === '' ? lines.length - 1 : lines.length;
};

export function computeDiff(source: string, formatted: string, pos: number): DiffResult {
  const changes: ChangeSpec[] = [];
  let changedLines = 0;

  const diffs = diff(source, formatted);

  for (let i = 0; i < diffs.length; i++) {
    const [op, text] = diffs[i];

    switch (op) {
      case diff.EQUAL: {
        pos += text.length;
        break;
      }
      case diff.INSERT: {
        changes.push({ from: pos, insert: text });

        const insertedLines = countLines(text);
        const nextOp = diffs[i + 1];

        // pure insertion (not part of a replace pair)
        if (!nextOp || nextOp[0] !== diff.DELETE) {
          changedLines += insertedLines;
        }
        break;
      }
      case diff.DELETE: {
        changes.push({ from: pos, to: pos + text.length });
        pos += text.length;

        const deletedLines = countLines(text);
        const nextOp = diffs[i + 1];

        if (nextOp?.[0] === diff.INSERT) {
          // replace pair (delete followed by insert): count the larger of the 2 sides
          const insertedLines = countLines(nextOp[1]);
          changedLines += Math.max(deletedLines, insertedLines);
        } else {
          // pure deletion
          changedLines += deletedLines;
        }
        break;
      }
    }
  }

  return { changes, changedLines };
}
