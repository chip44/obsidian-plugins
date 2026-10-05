import { isolateHistory } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';
import { createFromBuffer, type Formatter } from '@dprint/formatter';
import { noop } from '@shared/utils';
import { around } from 'monkey-around';
import { MarkdownView, normalizePath, Plugin, type Command } from 'obsidian';

import { computeDiff } from './diff';
import { DEFAULT_CONFIG, PlumbPluginSettingTab, type PluginConfig } from './settings';

export default class PlumbPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private formatter?: Formatter;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new PlumbPluginSettingTab(this));

    this.addCommands();

    this.app.workspace.onLayoutReady(async () => {
      const wasmPath = normalizePath(`${this.manifest.dir!}/dprint_plugin_markdown.wasm`);
      const buffer = await this.app.vault.adapter.readBinary(wasmPath);
      this.formatter = createFromBuffer(buffer);
    });
  }

  private addCommands(): void {
    this.addCommand({
      id: 'format-file',
      name: 'Format file',
      icon: 'file-cog',
      editorCheckCallback: (checking, editor, ctx) => {
        if (checking) return ctx.file?.extension === 'md';
        this.formatEditor(editor.cm, 'file');
        return true;
      },
    });

    this.addCommand({
      id: 'format-selection',
      name: 'Format selection',
      icon: 'text-selection',
      editorCheckCallback: (checking, editor, ctx) => {
        if (checking) return ctx.file?.extension === 'md';
        this.formatEditor(editor.cm, 'selection');
        return true;
      },
    });

    const onSaveFile = () => {
      if (!this.settings.formatOnSave) return false;
      const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
      if (!editor) return false;
      this.formatEditor(editor.cm, 'file');
      return true;
    };

    this.register(
      around(this.app.commands.commands['editor:save-file'], {
        checkCallback(oldCheckCallback) {
          if (!oldCheckCallback) return noop;
          return function (this: Command, ...args: Parameters<typeof oldCheckCallback>) {
            const result = oldCheckCallback?.apply(this, args);
            const checking = args[0];
            if (checking) return result;
            return onSaveFile();
          };
        },
      }),
    );
  }

  private formatEditor(view: EditorView, mode: 'file' | 'selection'): void {
    if (!this.formatter) {
      new Notice('Formatter is unavailable');
      return;
    }

    const sel = view.state.selection.main;
    const [from, to] = mode === 'file' ? [0, view.state.doc.length] : [sel.from, sel.to];

    const source = view.state.doc.sliceString(from, to);

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

    view.dispatch({
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
