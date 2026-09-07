import { type EditorView } from '@codemirror/view';

import { isEnabledForContext } from './context';
import { cloneKeyboardEvent, insertTextDOM } from './dom';
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
