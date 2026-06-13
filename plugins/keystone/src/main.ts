import { type Extension, Prec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Plugin } from 'obsidian';

import { onContextMenu } from './context-menu';
import { onKeydown } from './handler';
import {
  DEFAULT_CONFIG,
  handleRuntimeDataUpdate,
  MyPluginSettingTab,
  pluginConfig,
  type PluginConfig,
} from './settings';

export default class KeystonePlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private domEventHandler: Extension | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new MyPluginSettingTab(this));

    this.app.workspace.onLayoutReady(() => {
      this.registerEditorExtension([
        pluginConfig.of(this.settings),
        EditorView.updateListener.of(handleRuntimeDataUpdate),
      ]);

      /*
       * register the DOM event handler extension manually to put it at highest
       * priority. otherwise, if we use registerEditorExtension(), we might race
       * other plugins that intercept keyboard input, which results in conflicts.
       * of course, we will also have to unregister it manually (in onunload()).
       */
      this.domEventHandler = Prec.highest(EditorView.domEventHandlers({ keydown: onKeydown }));
      const editorExtensions = this.app.workspace.editorExtensions;
      editorExtensions.unshift(this.domEventHandler);
      this.app.workspace.updateOptions();
    });

    this.registerEvent(this.app.workspace.on('editor-menu', onContextMenu));
  }

  onunload(): void {
    if (this.domEventHandler) {
      const editorExtensions = this.app.workspace.editorExtensions;
      const idx = editorExtensions.indexOf(this.domEventHandler);
      if (idx !== -1) {
        editorExtensions.splice(idx, 1);
        this.app.workspace.updateOptions();
      }
      this.domEventHandler = null;
    }
  }

  async loadSettings(): Promise<void> {
    // oxlint-disable-next-line typescript/no-unsafe-assignment
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
