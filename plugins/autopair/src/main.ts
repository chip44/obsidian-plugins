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
    const config: CloseBracketConfig = {
      brackets: cleanStrings(this.settings.brackets.split(' ')),
      before: cleanStrings(this.settings.before.split(' ')).join(''),
      stringPrefixes: [','],
    };
    // precedence must be higher than `default` which is the precedence of the builtin autopair extension
    return Prec.high(EditorState.languageData.of(() => [{ closeBrackets: config }]));
  }

  private setEditorExtensions(): void {
    while (this.extensions.length > 0) this.extensions.pop();
    this.extensions.push(this.rebuildExtension(), closeBrackets());
  }
}
