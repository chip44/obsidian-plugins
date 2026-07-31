import { Facet, type EditorState } from '@codemirror/state';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';

import type KeystonePlugin from './main';

// temporary data, stored in memory, can be accessed globally using EditorView instance
interface PluginRuntimeData {
  blacklistedNodes: WeakSet<HTMLElement>;
}

const runtimeData = new WeakMap<EditorView, PluginRuntimeData>();

export function getRuntimeData(view: EditorView): PluginRuntimeData | undefined {
  return runtimeData.get(view);
}

export function handleRuntimeDataUpdate(update: ViewUpdate): void {
  if (update.startState && !runtimeData.has(update.view)) {
    runtimeData.set(update.view, {
      blacklistedNodes: new WeakSet(),
    });
  }
}

// persistent data, stored in obsidian plugin config, can be accessed using EditorState instance
export interface PluginConfig {
  mathBlocks: boolean;
  codeBlocks: boolean;
  contextMenu: boolean;
  compatibilityMode: boolean;
}

export const DEFAULT_CONFIG: PluginConfig = {
  mathBlocks: true,
  codeBlocks: true,
  contextMenu: true,
  compatibilityMode: false,
};

export const pluginConfig = Facet.define<PluginConfig, PluginConfig>({
  combine: (values) => values[0] || DEFAULT_CONFIG,
});

export function getPluginConfig(state: EditorState): PluginConfig {
  return state.facet(pluginConfig);
}

export class KeystonePluginSettingTab extends PluginSettingTab {
  readonly plugin: KeystonePlugin;
  public icon = 'keyboard';

  constructor(plugin: KeystonePlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Enable for math blocks',
        desc: createFragment((el) => {
          el.createSpan({ text: 'Includes both inline ' });
          el.createEl('code', { text: '$…$' });
          el.createSpan({ text: ' and blocks ' });
          el.createEl('code', { text: '$$…$$' });
          el.createSpan({ text: '.' });
        }),
        control: {
          type: 'toggle',
          key: 'mathBlocks',
        },
      },
      {
        name: 'Enable for code blocks',
        control: {
          type: 'toggle',
          key: 'codeBlocks',
        },
      },
      {
        name: 'Context menu entry',
        desc: 'Add an option to toggle key remap for the selected block.',
        control: {
          type: 'toggle',
          key: 'contextMenu',
        },
      },
      {
        name: 'Compatibility mode',
        desc: 'Try to fix conflicts with other plugins (e.g. Latex Suite).',
        control: {
          type: 'toggle',
          key: 'compatibilityMode',
        },
      },
    ];
  }
}
