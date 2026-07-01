import { closeBrackets, type CloseBracketConfig } from '@codemirror/autocomplete';
import { EditorState, type Extension, Prec } from '@codemirror/state';
import { Plugin } from 'obsidian';

import { DEFAULT_CONFIG, MyPluginSettingTab, type PluginConfig } from './settings';
import { cleanStrings } from './utils';

export default class AutopairPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private readonly extensions: Extension[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new MyPluginSettingTab(this));

    this.app.workspace.onLayoutReady(() => {
      this.extensions.push(this.rebuildExtension(), closeBrackets());
      this.registerEditorExtension(this.extensions);
    });
  }

  private rebuildExtension(): Extension {
    const config: CloseBracketConfig = {
      brackets: cleanStrings(this.settings.brackets),
      before: cleanStrings(this.settings.before).join(''),
      stringPrefixes: [','],
    };
    // precedence must be higher than `default` which is the precedence of the builtin autopair extension
    return Prec.high(EditorState.languageData.of(() => [{ closeBrackets: config }]));
  }

  async loadSettings(): Promise<void> {
    // oxlint-disable-next-line typescript/no-unsafe-assignment
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // mutate the extensions array
    this.extensions[0] = this.rebuildExtension();

    this.app.workspace.updateOptions();
  }
}
