import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';

import type PlumbPlugin from './main';

export interface PluginConfig {
  formatOnSave: boolean;
}

export const DEFAULT_CONFIG: PluginConfig = {
  formatOnSave: false,
};

export class PlumbPluginSettingTab extends PluginSettingTab {
  readonly plugin: PlumbPlugin;
  public icon = 'wand-sparkles';

  constructor(plugin: PlumbPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Format on save',
        control: {
          type: 'toggle',
          key: 'formatOnSave',
        },
      },
    ];
  }
}
