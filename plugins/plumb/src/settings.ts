import { PluginSettingTab, Setting } from 'obsidian';

import type PlumbPlugin from './main';

export interface PluginConfig {
  formatOnSave: boolean;
}

export const DEFAULT_CONFIG: PluginConfig = {
  formatOnSave: false,
};

export class MyPluginSettingTab extends PluginSettingTab {
  readonly plugin: PlumbPlugin;
  public icon = 'wand-sparkles';

  constructor(plugin: PlumbPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Format on save')
      .setDesc('')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.formatOnSave).onChange(async (value) => {
          this.plugin.settings.formatOnSave = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
