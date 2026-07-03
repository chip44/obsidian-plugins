import { setInputCode } from '@shared/dom';
import { cleanStrings } from '@shared/utils';
import { PluginSettingTab, SettingGroup } from 'obsidian';

import type MatchBracketsPlugin from './main';

export interface PluginConfig {
  brackets: string[];
  maxScanDistance: number;
}

export const DEFAULT_CONFIG: PluginConfig = {
  brackets: ['()', '[]', '{}'],
  maxScanDistance: 10_000,
};

export class MyPluginSettingTab extends PluginSettingTab {
  readonly plugin: MatchBracketsPlugin;
  public icon = 'parentheses';

  constructor(plugin: MatchBracketsPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new SettingGroup(containerEl)
      .addSetting((setting) => {
        setting
          .setName('Brackets')
          .setDesc('Space-separated bracket pairs to match.')
          .addText((text) =>
            text
              .then(setInputCode)
              .setPlaceholder(DEFAULT_CONFIG.brackets.join(' '))
              .setValue(this.plugin.settings.brackets.join(' '))
              .onChange(async (value) => {
                this.plugin.settings.brackets = cleanStrings(value.split(' '));
                await this.plugin.saveSettings();
              }),
          );
      })
      .addSetting((setting) => {
        setting
          .setName('Max scan distance')
          .setDesc('The maximum distance to scan for matching brackets.')
          .addText((text) =>
            text
              .then(setInputCode)
              .setPlaceholder(DEFAULT_CONFIG.maxScanDistance.toString())
              .setValue(this.plugin.settings.maxScanDistance.toString())
              .onChange(async (value) => {
                this.plugin.settings.maxScanDistance =
                  Math.trunc(Number(value)) || DEFAULT_CONFIG.maxScanDistance;
                await this.plugin.saveSettings();
              }),
          );
      });
  }
}
