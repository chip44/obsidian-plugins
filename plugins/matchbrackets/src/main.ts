import { bracketMatching, type Config as BracketMatchingConfig } from '@codemirror/language';
import { type Extension } from '@codemirror/state';
import { Plugin } from 'obsidian';

import { DEFAULT_CONFIG, MyPluginSettingTab, pluginConfig, type PluginConfig } from './settings';
import { cleanStrings } from './utils';

export default class MatchBracketsPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private readonly extensions: Extension[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new MyPluginSettingTab(this));

    this.app.workspace.onLayoutReady(() => {
      this.extensions.push(pluginConfig.of(this.settings), this.rebuildExtension());
      this.registerEditorExtension(this.extensions);
    });
  }

  private rebuildExtension(): Extension {
    const config: BracketMatchingConfig = {
      brackets: cleanStrings(this.settings.brackets).join(''),
      maxScanDistance: this.settings.maxScanDistance,
    };
    return bracketMatching(config);
  }

  async loadSettings(): Promise<void> {
    // oxlint-disable-next-line typescript/no-unsafe-assignment
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // mutate the extensions array
    this.extensions[1] = this.rebuildExtension();

    this.app.workspace.updateOptions();
  }
}
