import { PluginSettingTab, Setting } from 'obsidian';

import type BreathingRoomPlugin from './main';

export interface PluginConfig {
  allowBackslash: boolean;
}

export const DEFAULT_CONFIG: PluginConfig = {
  allowBackslash: false,
};

export class MyPluginSettingTab extends PluginSettingTab {
  readonly plugin: BreathingRoomPlugin;
  public icon = 'orbit';

  constructor(plugin: BreathingRoomPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(
        createFragment((el) => {
          el.createSpan({ text: 'Allow backslash (' });
          el.createEl('code', { text: '\\' });
          el.createSpan({ text: ') before closing ' });
          el.createEl('code', { text: '$' });
        }),
      )
      .setDesc(
        createFragment((el) => {
          el.createSpan({ text: 'This might cause breakage, use sparingly.', cls: 'mod-warning' });
        }),
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.allowBackslash).onChange(async (value) => {
          this.plugin.settings.allowBackslash = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
