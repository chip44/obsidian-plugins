import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';

import type MatchBracketsPlugin from './main';

export interface PluginConfig {
  brackets: string;
  maxScanDistance: number;
}

export const DEFAULT_CONFIG: PluginConfig = {
  brackets: '() [] {}',
  maxScanDistance: 10_000,
};

export class MyPluginSettingTab extends PluginSettingTab {
  readonly plugin: MatchBracketsPlugin;
  public icon = 'parentheses';

  constructor(plugin: MatchBracketsPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Brackets',
        desc: 'Bracket pairs to match.',
        control: {
          type: 'text',
          key: 'brackets',
          placeholder: DEFAULT_CONFIG.brackets,
          validate: (value: string) =>
            !value.trim ||
            value
              .trim()
              .split(/\s+/u)
              .every((pair) => pair.length === 2 && pair[0] !== pair[1])
              ? undefined
              : 'Pairs must be space-separated and different characters.',
        },
      },
      {
        name: 'Max scan distance',
        desc: 'The maximum distance to scan for matching brackets.',
        control: {
          type: 'number',
          key: 'maxScanDistance',
          defaultValue: DEFAULT_CONFIG.maxScanDistance,
          min: 0,
        },
      },
    ];
  }
}
