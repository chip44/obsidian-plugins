import { isolateHistory } from '@codemirror/commands';
import type { ChangeSpec } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { createFromBuffer, type Formatter } from '@dprint/formatter';
import diff from 'fast-diff';
import { type Editor, MarkdownView, normalizePath, Plugin } from 'obsidian';

import { DEFAULT_CONFIG, PlumbPluginSettingTab, type PluginConfig } from './settings';

interface DiffResult {
  changes: ChangeSpec[];
  changedLines: number;
}

const countLines = (text: string): number => {
  const lines = text.split('\n');
  // a trailing empty string from split means the text ended with \n, so the last "line" is empty and shouldn't be counted
  return lines.at(-1) === '' ? lines.length - 1 : lines.length;
};

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

    // @ts-expect-error: conflicts with obsidian-typings
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const cm = editor.cm as EditorView;

    const sel = cm.state.selection.main;
    const [from, to] = mode === 'file' ? [0, cm.state.doc.length] : [sel.from, sel.to];

    const source = cm.state.doc.sliceString(from, to);

    const durationStart = performance.now();

    const formatted = this.formatter.formatText({
      filePath: this.app.workspace.getActiveFile()?.path ?? '',
      fileText: source,
      overrideConfig: {
        lineWidth: 0,
        // TODO: these are currently ignored by dprint's Markdown plugin (as of v0.22.1)
        // useTabs: this.app.vault.getConfig('useTab') as boolean,
        // indentWidth: this.app.vault.getConfig('tabSize') as number,
      },
    });

    if (source === formatted) {
      // no reason to dispatch
      return;
    }

    const diffResult = this.computeDiff(source, formatted, from);

    const duration = performance.now() - durationStart;

    cm.dispatch({
      changes: diffResult.changes,
      annotations: isolateHistory.of('full'),
      scrollIntoView: true,
      filter: false,
    });

    new Notice(
      `Formatted ${diffResult.changedLines} line${diffResult.changedLines === 1 ? '' : 's'} in ${Math.round(duration)} ms`,
    );
  }

  private computeDiff(source: string, formatted: string, pos: number): DiffResult {
    const changes: ChangeSpec[] = [];
    let changedLines = 0;

    const diffs = diff(source, formatted);

    for (let i = 0; i < diffs.length; i++) {
      const [op, text] = diffs[i];

      switch (op) {
        case diff.EQUAL: {
          pos += text.length;
          break;
        }
        case diff.INSERT: {
          changes.push({ from: pos, insert: text });

          const insertedLines = countLines(text);
          const nextOp = diffs[i + 1];

          // pure insertion (not part of a replace pair)
          if (!nextOp || nextOp[0] !== diff.DELETE) {
            changedLines += insertedLines;
          }
          break;
        }
        case diff.DELETE: {
          changes.push({ from: pos, to: pos + text.length });
          pos += text.length;

          const deletedLines = countLines(text);
          const nextOp = diffs[i + 1];

          if (nextOp?.[0] === diff.INSERT) {
            // replace pair (delete followed by insert): count the larger of the 2 sides
            const insertedLines = countLines(nextOp[1]);
            changedLines += Math.max(deletedLines, insertedLines);
          } else {
            // pure deletion
            changedLines += deletedLines;
          }
          break;
        }
      }
    }

    return { changes, changedLines };
  }

  async loadSettings(): Promise<void> {
    // oxlint-disable-next-line typescript/no-unsafe-assignment
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
