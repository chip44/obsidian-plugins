import type { DragManager } from '@obsidian-typings/obsidian-public-latest';
import { around } from 'monkey-around';
import { Plugin } from 'obsidian';

import { fireConfetti } from './confetti';
import { DEFAULT_CONFIG, KanbanConfettiPluginSettingTab, type PluginConfig } from './settings';

const COLUMN_CLASS = 'bases-kanban-column';
const COLUMN_SELECTOR = `.${COLUMN_CLASS}`;
const COLUMN_NAME_SELECTOR = '.bases-kanban-column-header .bases-group-value';

export default class KanbanConfettiPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;

  // oxlint-disable-next-line max-lines-per-function
  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new KanbanConfettiPluginSettingTab(this));

    let startColumn: HTMLElement | null = null;

    const onDragEvent = (event: DragEvent): void => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const target = event.target as HTMLElement;

      if (event.type === 'dragenter') {
        startColumn ??= target.closest(COLUMN_SELECTOR);
        return;
      }

      if (event.type !== 'drop' || !startColumn) {
        return;
      }

      const dropColumn = target.closest(COLUMN_SELECTOR);
      if (dropColumn && dropColumn !== startColumn) {
        const columnName = dropColumn.querySelector(COLUMN_NAME_SELECTOR)?.textContent ?? '';
        if (new RegExp(this.settings.columnRegex, 'ui').test(columnName)) {
          const { left, top } = dropColumn.getBoundingClientRect();
          void fireConfetti({
            x: left / window.innerWidth,
            y: top / window.innerHeight,
          });
        }
      }

      startColumn = null;
    };

    this.register(
      around(this.app.dragManager, {
        handleDrop: (oldHandleDrop) =>
          function (this: DragManager, ...args: Parameters<typeof oldHandleDrop>) {
            const [containerEl, dropHandler] = args;

            if (containerEl.classList.contains(COLUMN_CLASS)) {
              args[1] = (event, draggable, isOver) => {
                const result = dropHandler(event, draggable, isOver);
                onDragEvent(event);
                return result;
              };
            }

            oldHandleDrop.apply(this, args);
          },
      }),
    );
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
