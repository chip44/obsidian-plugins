import { closeBrackets, type CloseBracketConfig } from '@codemirror/autocomplete';
import { EditorState, type Extension, Prec } from '@codemirror/state';
import { cleanStrings } from '@shared/utils';
import { Plugin } from 'obsidian';

import { DEFAULT_CONFIG, AutopairPluginSettingTab, type PluginConfig } from './settings';

export default class AutopairPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private readonly extensions: Extension[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new AutopairPluginSettingTab(this));

    this.app.workspace.onLayoutReady(() => {
      this.extensions.push(this.rebuildExtension(), closeBrackets());
      this.registerEditorExtension(this.extensions);
    });
  }

  private rebuildExtension(): Extension {
    const config: CloseBracketConfig = {
      brackets: cleanStrings(this.settings.brackets.split(' ')),
      before: cleanStrings(this.settings.before.split(' ')).join(''),
      stringPrefixes: [','],
    };
    // precedence must be higher than `default` which is the precedence of the builtin autopair extension
    return Prec.high(EditorState.languageData.of(() => [{ closeBrackets: config }]));
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // mutate the extensions array
    this.extensions[0] = this.rebuildExtension();

    this.app.workspace.updateOptions();
  }
}
