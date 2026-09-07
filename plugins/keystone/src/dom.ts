import { getLineElement } from '@shared/dom';

/**
 * walk the DOM from `start` to `end` and remove all elements between them
 */
function removeInbetweenElements(
  start: Element,
  end: Element,
  root: Element = activeDocument.body,
): void {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

  // advance to start
  let node = walker.nextNode();
  while (node && node !== start) {
    node = walker.nextNode();
  }
  if (node !== start) return;

  // collect everything between `start` and `end`
  const toRemove: Element[] = [];
  node = walker.nextNode();
  while (node && node !== end) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    toRemove.push(node as Element);
    node = walker.nextNode();
  }
  if (node !== end) return;

  for (const el of toRemove) {
    el.remove();
  }
}

/**
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

/**
 * insert text in the DOM during a single-node selection (e.g. inside the same text node (nodeType === Node.TEXT_NODE) of an element)
 */
function insertTextDOMSingle(range: Range, text: string): void {
  const textNode = activeDocument.createTextNode(text);
  range.deleteContents();
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
}

/**
 * insert text in the DOM during a multi-node selection (e.g. between 2 different spans)
 */
function insertTextDOMMulti(
  range: Range,
  startLine: HTMLElement,
  endLine: HTMLElement,
  text: string,
): void {
  if (!startLine.parentElement) return;

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
}

/**
 * insert text at current cursor position in the DOM
 */
export function insertTextDOM(node: Node, text: string): void {
  const selection = activeWindow.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  node = getLineElement(node) ?? node;
  const range = selection.getRangeAt(0);

  // single-node selection (or no selection at all)
  if (node.contains(range.startContainer) && node.contains(range.endContainer)) {
    insertTextDOMSingle(range, text);
    return;
  }

  // multi-node selection
  const startLine = getLineElement(range.startContainer);
  const endLine = getLineElement(range.endContainer);
  if (startLine?.parentElement && startLine.parentElement === endLine?.parentElement) {
    insertTextDOMMulti(range, startLine, endLine, text);
    return;
  }

  // fallback to regular append
  node.textContent += text;
  range.selectNodeContents(node);
  range.collapse(false);
}

export function cloneKeyboardEvent(
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
