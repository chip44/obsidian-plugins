import { isolateHistory } from '@codemirror/commands';
import { createFromBuffer, type Formatter } from '@dprint/formatter';
import { type Editor, MarkdownView, normalizePath, Plugin } from 'obsidian';

import { computeDiff } from './diff';
import { DEFAULT_CONFIG, PlumbPluginSettingTab, type PluginConfig } from './settings';

export default class PlumbPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private formatter?: Formatter;
  private originalSaveCallback?: (checking: boolean) => boolean | void;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new PlumbPluginSettingTab(this));

    this.addCommand({
      id: 'format-file',
      name: 'Format file',
      icon: 'file-cog',
      editorCheckCallback: (checking, editor, ctx) => {
        if (checking) return ctx.file?.extension === 'md';
        this.formatEditor(editor, 'file');
        return true;
      },
    });

    this.addCommand({
      id: 'format-selection',
      name: 'Format selection',
      icon: 'text-selection',
      editorCheckCallback: (checking, editor, ctx) => {
        if (checking) return ctx.file?.extension === 'md';
        this.formatEditor(editor, 'selection');
        return true;
      },
    });

    const saveFileCommand = this.app.commands.commands['editor:save-file'];
    this.originalSaveCallback = saveFileCommand.checkCallback;
    if (this.originalSaveCallback) {
      saveFileCommand.checkCallback = (checking) => {
        const result = this.originalSaveCallback!(checking);

        if (checking) return result;

        if (!this.settings.formatOnSave) return false;

        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (!editor) return false;
        this.formatEditor(editor, 'file');
        return true;
      };
    }

    this.app.workspace.onLayoutReady(async () => {
      const wasmPath = normalizePath(`${this.manifest.dir!}/dprint_plugin_markdown.wasm`);
      const buffer = await this.app.vault.adapter.readBinary(wasmPath);
      this.formatter = createFromBuffer(buffer);
    });
  }

  onunload(): void {
    const saveFileCommand = this.app.commands.commands['editor:save-file'];
    if (saveFileCommand.checkCallback && this.originalSaveCallback) {
      saveFileCommand.checkCallback = this.originalSaveCallback;
    }
  }

  private formatEditor(editor: Editor, mode: 'file' | 'selection'): void {
    if (!this.formatter) {
      new Notice('Formatter is unavailable');
      return;
    }

    const cm = editor.cm;

    const sel = cm.state.selection.main;
    const [from, to] = mode === 'file' ? [0, cm.state.doc.length] : [sel.from, sel.to];

    const source = cm.state.doc.sliceString(from, to);

    const durationStart = performance.now();

    const formatted = this.formatter.formatText({
      filePath: this.app.workspace.getActiveFile()?.path ?? '',
      fileText: source,
      overrideConfig: this.getFormatConfig(),
    });

    if (source === formatted) {
      // no reason to dispatch
      return;
    }

    const diffResult = computeDiff(source, formatted, from);

    const duration = performance.now() - durationStart;

    cm.dispatch({
      changes: diffResult.changes,
      annotations: isolateHistory.of('full'),
      scrollIntoView: true,
      filter: false,
    });

    if (this.settings.showNotice) {
      const n = diffResult.changedLines;
      new Notice(`Formatted ${n} line${n === 1 ? '' : 's'} in ${duration.toFixed(1)} ms`);
    }
  }

  private getFormatConfig(): Record<string, unknown> {
    // reference: https://dprint.dev/plugins/markdown/config/
    return {
      // handled by Obsidian
      lineWidth: 0,
      'table.skipFormat': true,
      // inherit from Obsidian
      useTabs: this.app.vault.getConfig('useTab'),
      indentWidth: this.app.vault.getConfig('tabSize'),
      // user config
      emphasisKind: this.settings.emphasisKind,
      strongKind: this.settings.strongKind,
      'list.unorderedMarker': this.settings.unorderedListMarker,
      maxBlankLines: this.settings.maxBlankLines,
    };
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
