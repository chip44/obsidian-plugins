import { ensureSyntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNodeRef } from '@lezer/common';

import { getLineElement } from './dom';

export const STATE_CONTEXTS = ['text', 'math', 'code'] as const;
export type StateContext = (typeof STATE_CONTEXTS)[number];

interface NodeContext {
  node?: SyntaxNodeRef;
  context: StateContext;
}

export function getStateContext(state: EditorState): NodeContext {
  let node: SyntaxNodeRef | null = null;

  node = nodeWithinEquation(state);
  if (node) return { node, context: 'math' };

  node = nodeWithinCodeblock(state);
  if (node) return { node, context: 'code' };

  return { context: 'text' };
}

function nodeWithinEquation(state: EditorState): SyntaxNodeRef | null {
  const pos = state.selection.main.to;
  const cursor = ensureSyntaxTree(state, pos)?.cursor();
  if (!cursor) return null;

  cursor.moveTo(pos, -1);
  let beforeName = cursor.name;

  // edgecase: cursor is at the start of a line
  if (beforeName === 'Document') {
    // check only the previous position, as that's also what CM's syntax highlighting does
    cursor.moveTo(pos - 1, -1);
    beforeName = cursor.name;
  }

  if (!isMath(beforeName)) return null;

  cursor.childAfter(pos);
  let afterName = cursor.name;
  if (!isMath(afterName)) return null;

  // edgecase: cursor is inside begin block ($|$)
  if (isMathBegin(beforeName) && isMathBegin(afterName)) {
    cursor.next();
    afterName = cursor.name;
  }

  // edgecase: cursor is between/after end block ($|$ or $$|)
  if (isMathEnd(beforeName) && isMathEnd(afterName) && getTextAtPos(state, pos - 1, 2) !== '$$') {
    return null;
  }

  return cursor;
}

function nodeWithinCodeblock(state: EditorState): SyntaxNodeRef | null {
  const pos = state.selection.main.to;
  const cursor = ensureSyntaxTree(state, pos)?.cursor();
  if (!cursor) return null;

  cursor.childBefore(pos);
  const beforeName = cursor.name;
  if (!isCodeblock(beforeName)) return null;

  // edgecase: cursor is before begin block (|```)
  if ((isCodeblockBegin(beforeName) && pos < cursor.to) || isCodeblockEnd(beforeName)) {
    return null;
  }

  cursor.childAfter(pos);
  const afterName = cursor.name;
  if (!isCodeblock(afterName)) return null;

  return cursor;
}

function getTextAtPos(state: EditorState, pos: number, num: number = 1): string {
  return state.sliceDoc(pos, pos + num);
}

export function getNodeElement(view: EditorView, node: SyntaxNodeRef): HTMLElement | null {
  return getLineElement(view.domAtPos(node.from).node);
}

function isMath(name: string): boolean {
  return name.includes('math');
}

function isMathBegin(name: string): boolean {
  return name.includes('math-begin');
}

function isMathEnd(name: string): boolean {
  return name.includes('math-end');
}

function isCodeblock(name: string): boolean {
  return name.includes('codeblock');
}

function isCodeblockBegin(name: string): boolean {
  return name.includes('codeblock-begin');
}

function isCodeblockEnd(name: string): boolean {
  return name.includes('codeblock-end');
}
