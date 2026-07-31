import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';

import type BreathingRoomPlugin from './main';

export interface PluginConfig {
  allowBackslash: boolean;
}

export const DEFAULT_CONFIG: PluginConfig = {
  allowBackslash: false,
};

export class BreathingRoomPluginSettingTab extends PluginSettingTab {
  readonly plugin: BreathingRoomPlugin;
  public icon = 'orbit';

  constructor(plugin: BreathingRoomPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Allow backslash (\\) before closing $',
        desc: createFragment((el) => {
          el.createSpan({ text: 'This might cause breakage, use sparingly.', cls: 'mod-warning' });
        }),
        control: {
          type: 'toggle',
          key: 'allowBackslash',
        },
      },
    ];
  }
}
