import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';

import type KanbanConfettiPlugin from './main';

function isValidRegex(str: string): boolean {
  try {
    new RegExp(str, 'u');
    return true;
  } catch {
    return false;
  }
}

export interface PluginConfig {
  columnRegex: string;
}

export const DEFAULT_CONFIG: PluginConfig = {
  columnRegex: '^(done|submitted)$',
};

export class KanbanConfettiPluginSettingTab extends PluginSettingTab {
  readonly plugin: KanbanConfettiPlugin;
  public icon = 'party-popper';

  constructor(plugin: KanbanConfettiPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Column name matcher',
        desc: 'Confetti will only be fired for columns that match the RegEx (case-insensitive).',
        control: {
          type: 'text',
          key: 'columnRegex',
          defaultValue: DEFAULT_CONFIG.columnRegex,
          placeholder: DEFAULT_CONFIG.columnRegex,
          validate: (value: string) =>
            !value.trim() || isValidRegex(value) ? undefined : 'Must be a valid RegEx.',
        },
      },
    ];
  }
}
