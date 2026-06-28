import type { TextComponent } from 'obsidian';

export function setInputCode(component: TextComponent): void {
  // eslint-disable-next-line obsidianmd/no-static-styles-assignment
  component.inputEl.setCssProps({
    'font-family': 'var(--font-monospace)',
    'font-size': 'var(--font-smaller)',
  });
}
