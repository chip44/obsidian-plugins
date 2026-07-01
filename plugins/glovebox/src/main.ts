import type { Extension } from '@codemirror/state';
import { Plugin } from 'obsidian';

import {
  DEFAULT_CONFIG,
  GloveboxPluginSettingTab,
  pluginConfig,
  type PluginConfig,
} from './settings';
import { snippetRunner, snippetTrigger } from './snippets';

export default class GloveboxPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private readonly extensions: Extension[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new GloveboxPluginSettingTab(this));

    this.app.workspace.onLayoutReady(() => {
      this.extensions.push(pluginConfig.of(this.settings), snippetTrigger, snippetRunner);
      this.registerEditorExtension(this.extensions);
    });
  }

  async loadSettings(): Promise<void> {
    // oxlint-disable-next-line typescript/no-unsafe-assignment
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // WHY DO I HAVE TO RECONFIGURE THIS
    this.extensions[0] = pluginConfig.of(this.settings);

    this.app.workspace.updateOptions();
  }
}
