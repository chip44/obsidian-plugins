import { setInputCode } from '@shared/dom';
import { cleanStrings } from '@shared/utils';
import { PluginSettingTab, Setting } from 'obsidian';

import type AutopairPlugin from './main';

export interface PluginConfig {
  brackets: string[];
  before: string[];
}

export const DEFAULT_CONFIG: PluginConfig = {
  // Obsidian defaults
  brackets: ['(', '[', '{', "'", '"', '*', '_', '`', '```'],
  before: [')', ']', '}', "'", '"', ':', ';', '>'],
};

export class AutopairPluginSettingTab extends PluginSettingTab {
  readonly plugin: AutopairPlugin;
  public icon = 'braces';

  constructor(plugin: AutopairPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Brackets')
      .setDesc(
        createFragment((el) => {
          el.createSpan({
            text: 'Space-separated opening brackets to close. Brackets may be single characters or a triple of quotes (as in ',
          });
          el.createEl('code', { text: "\"'''\"" });
          el.createSpan({ text: ').' });
        }),
      )
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

    new Setting(containerEl)
      .setName('Before')
      .setDesc(
        'Space-separated characters in front of which newly opened brackets are automatically closed.',
      )
      .addText((text) =>
        text
          .then(setInputCode)
          .setPlaceholder(DEFAULT_CONFIG.before.join(' '))
          .setValue(this.plugin.settings.before.join(' '))
          .onChange(async (value) => {
            this.plugin.settings.before = cleanStrings(value.split(' '));
            await this.plugin.saveSettings();
          }),
      );
  }
}
