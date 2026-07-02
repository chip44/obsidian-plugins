import { type EditorView } from '@codemirror/view';
import { getLineElement, removeInbetweenElements } from '@shared/context';

import { isEnabledForContext } from './context';
import { getPluginConfig } from './settings';

const qwertyMap: Record<string, string> = {
  KeyA: 'a',
  KeyB: 'b',
  KeyC: 'c',
  KeyD: 'd',
  KeyE: 'e',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyI: 'i',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  KeyM: 'm',
  KeyN: 'n',
  KeyO: 'o',
  KeyP: 'p',
  KeyQ: 'q',
  KeyR: 'r',
  KeyS: 's',
  KeyT: 't',
  KeyU: 'u',
  KeyV: 'v',
  KeyW: 'w',
  KeyX: 'x',
  KeyY: 'y',
  KeyZ: 'z',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  Digit0: '0',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
};

const punctShiftMap: Record<string, string> = {
  '`': '~',
  '1': '!',
  '2': '@',
  '3': '#',
  '4': '$',
  '5': '%',
  '6': '^',
  '7': '&',
  '8': '*',
  '9': '(',
  '0': ')',
  '-': '_',
  '=': '+',
  '[': '{',
  ']': '}',
  '\\': '|',
  ';': ':',
  "'": '"',
  ',': '<',
  '.': '>',
  '/': '?',
};

function codeToChar(code: string, shiftKey: boolean, capsLock: boolean): string | undefined {
  let char = qwertyMap[code];
  if (!char) return undefined;

  const isLetter = 'a' <= char && char <= 'z';
  const useShifted = shiftKey !== (isLetter && capsLock);
  if (useShifted) {
    char = isLetter ? char.toUpperCase() : punctShiftMap[char];
  }

  return char;
}

export function onKeydown(event: KeyboardEvent, view: EditorView): void {
  if (!event.isTrusted || event.ctrlKey || event.altKey || event.metaKey) return;

  const char = codeToChar(event.code, event.shiftKey, event.getModifierState('CapsLock'));
  if (!char || char === event.key) return;

  if (!isEnabledForContext(view)) return;

  const newEvent = cloneKeyboardEvent(event, { key: char, bubbles: false, cancelable: true });
  typeText(view, newEvent);
  event.preventDefault();
}

function typeText(view: EditorView, newEvent: KeyboardEvent): void {
  const config = getPluginConfig(view.state);

  if (config.compatibilityMode) {
    /*
     * dispatch a synthetic keydown so that other plugins that listen to keydown
     * events (e.g. Latex Suite) can see the modified keystroke.
     * dispatchEvent() returns false if any listener called `preventDefault()`,
     * meaning another handler consumed the key and we should not insert
     * anything ourselves.
     */
    const unhandled = view.contentDOM.dispatchEvent(newEvent);
    if (!unhandled) return;

    /*
     * mega hack to trigger internal CodeMirror input handlers + other external
     * input handlers. this is required so that other handlers see the modified
     * keystroke and act upon it (otherwise, they either use the old one or just
     * don't run at all).
     * it basically updates node.textContent manually (while handling cursor
     * selection) which triggers CodeMirror's internal DOM observer, the same
     * way a real user input event does it.
     */
    const node = view.domAtPos(view.state.selection.main.head).node;
    insertTextDOM(node, newEvent.key);
    return;
  }

  view.dispatch({
    ...view.state.replaceSelection(newEvent.key),
    userEvent: 'input.type',
  });
}

/*
 * range.setStart/setEnd want a char offset on Text nodes but a child index on
 * Elements, and an emptied container has 0 children, so resolve to the Text
 * child (or offset 0 if none) to avoid IndexSizeError.
 */
function resolveTextPosition(container: Node, offset: number): [Node, number] {
  if (container.nodeType !== Node.TEXT_NODE) {
    const child = container.firstChild;
    return child ? [child, offset] : [container, 0];
  }
  return [container, offset];
}

/*
 * inserts text at current cursor position in the DOM
 */
// oxlint-disable-next-line max-lines-per-function
function insertTextDOM(node: Node, text: string): void {
  const selection = activeWindow.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // single-node selection (or no selection at all)
  if (node.contains(range.startContainer) && node.contains(range.endContainer)) {
    const textNode = activeDocument.createTextNode(text);
    range.deleteContents();
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    return;
  }

  // multi-node selection
  const startLine = getLineElement(range.startContainer);
  const endLine = getLineElement(range.endContainer);
  if (startLine?.parentElement && startLine.parentElement === endLine?.parentElement) {
    const startText = range.startContainer.textContent ?? '';
    const endText = range.endContainer.textContent ?? '';
    const before = startText.slice(0, range.startOffset);
    const after = endText.slice(range.endOffset);

    if (startLine === endLine) {
      range.startContainer.textContent = before + text;
      range.endContainer.textContent = after;
    } else {
      // in multi-LINE selection, nodes are not actually combined so we have to
      // manually add the rest of the text
      range.startContainer.textContent = before + text + after;
      range.endContainer.textContent = '';
    }

    removeInbetweenElements(
      range.startContainer.parentElement!,
      range.endContainer.parentElement!,
      startLine.parentElement,
    );

    // this causes removeInbetweenElements to lose the end element so it must run after it
    const [startNode, startOffset] = resolveTextPosition(
      range.startContainer,
      before.length + text.length,
    );
    range.setStart(startNode, startOffset);
    range.setEnd(startNode, startOffset);

    return;
  }

  // fallback to regular append
  node.textContent += text;
  range.selectNodeContents(node);
  range.collapse(false);
}

function cloneKeyboardEvent(
  e: KeyboardEvent,
  overrides: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  // somehow this is the only way to clone an event :^)
  return new KeyboardEvent(e.type, {
    key: e.key,
    code: e.code,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
    repeat: e.repeat,
    isComposing: e.isComposing,
    bubbles: e.bubbles,
    cancelable: e.cancelable,
    composed: e.composed,
    location: e.location,
    detail: e.detail,
    view: e.view,
    ...overrides,
  });
}
