import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';

import type AutopairPlugin from './main';

export interface PluginConfig {
  brackets: string;
  before: string;
}

export const DEFAULT_CONFIG: PluginConfig = {
  // Obsidian defaults
  brackets: '( [ { \' " * _ ` ```',
  before: ') ] } \' " : ; >',
};

export class AutopairPluginSettingTab extends PluginSettingTab {
  readonly plugin: AutopairPlugin;
  public icon = 'braces';

  constructor(plugin: AutopairPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Brackets',
        desc: 'Opening brackets to close.',
        control: {
          type: 'text',
          key: 'brackets',
          placeholder: DEFAULT_CONFIG.brackets,
          validate: (value: string) =>
            value
              .trim()
              .split(/\s+/u)
              .every((token) => /^(.)(?:|\1{2})$/iu.test(token))
              ? undefined
              : 'Characters must be space-separated and may be single characters or a triple of the same character.',
        },
      },
      {
        name: 'Before',
        desc: 'Characters in front of which newly opened brackets are automatically closed.',
        control: {
          type: 'text',
          key: 'before',
          placeholder: DEFAULT_CONFIG.before,
          validate: (value: string) =>
            /^\S(?:\s+\S)*$/iu.test(value.trim())
              ? undefined
              : 'Characters must be space-separated.',
        },
      },
    ];
  }
}
