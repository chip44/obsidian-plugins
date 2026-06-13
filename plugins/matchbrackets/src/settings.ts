import { Facet } from '@codemirror/state';
import { PluginSettingTab, Setting } from 'obsidian';

import type MatchBracketsPlugin from './main';
import { cleanStrings } from './utils';

/* eslint-disable obsidianmd/no-static-styles-assignment */

export interface PluginConfig {
  brackets: string[];
  maxScanDistance: number;
}

export const DEFAULT_CONFIG: PluginConfig = {
  brackets: ['()', '[]', '{}'],
  maxScanDistance: 10_000,
};

export const pluginConfig = Facet.define<PluginConfig, PluginConfig>({
  combine: (values) => values[0] || DEFAULT_CONFIG,
});

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

    new Setting(containerEl)
      .setName('Brackets')
      .setDesc('Space-separated bracket pairs to match.')
      .addText((text) =>
        text
          .then((c) => {
            c.inputEl.style.fontFamily = 'var(--font-monospace)';
            c.inputEl.style.fontSize = 'var(--font-smaller)';
          })
          .setPlaceholder(DEFAULT_CONFIG.brackets.join(' '))
          .setValue(this.plugin.settings.brackets.join(' '))
          .onChange(async (value) => {
            this.plugin.settings.brackets = cleanStrings(value.split(' '));
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Max scan distance')
      .setDesc('The maximum distance to scan for matching brackets.')
      .addText((text) =>
        text
          .then((c) => {
            c.inputEl.style.fontFamily = 'var(--font-monospace)';
            c.inputEl.style.fontSize = 'var(--font-smaller)';
          })
          .setPlaceholder(DEFAULT_CONFIG.maxScanDistance.toString())
          .setValue(this.plugin.settings.maxScanDistance.toString())
          .onChange(async (value) => {
            this.plugin.settings.maxScanDistance =
              Number.parseInt(value, 10) || DEFAULT_CONFIG.maxScanDistance;
            await this.plugin.saveSettings();
          }),
      );
  }
}
