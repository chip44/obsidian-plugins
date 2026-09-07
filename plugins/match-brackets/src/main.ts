import { bracketMatching, type Config as BracketMatchingConfig } from '@codemirror/language';
import { type Extension } from '@codemirror/state';
import { cleanStrings } from '@shared/utils';
import { Plugin } from 'obsidian';

import { DEFAULT_CONFIG, MyPluginSettingTab, type PluginConfig } from './settings';

export default class MatchBracketsPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private readonly extensions: Extension[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new MyPluginSettingTab(this));

    this.app.workspace.onLayoutReady(() => {
      this.setEditorExtensions();
      this.registerEditorExtension(this.extensions);
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.setEditorExtensions();
    this.app.workspace.updateOptions();
  }

  private rebuildExtension(): Extension {
    const config: BracketMatchingConfig = {
      brackets: cleanStrings(this.settings.brackets.split(' ')).join(''),
      maxScanDistance: this.settings.maxScanDistance,
    };
    return bracketMatching(config);
  }

  private setEditorExtensions(): void {
    while (this.extensions.length > 0) this.extensions.pop();
    this.extensions.push(this.rebuildExtension());
  }
}
