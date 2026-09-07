import type { TextComponent } from 'obsidian';

export function setInputCode(component: TextComponent): void {
  // oxlint-disable-next-line obsidianmd/no-static-styles-assignment -- too insignificant to ship a separate styles.css file
  component.inputEl.setCssProps({
    'font-family': 'var(--font-monospace)',
    'font-size': 'var(--font-smaller)',
  });
}

export function getLineElement(node: Node): HTMLElement | null {
  return node.instanceOf(HTMLElement)
    ? node.closest('.cm-line')
    : (node.parentElement?.closest('.cm-line') ?? null);
}
