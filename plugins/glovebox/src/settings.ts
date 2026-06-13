import { snippet } from '@codemirror/autocomplete';
import { type EditorState, Facet } from '@codemirror/state';
import { PluginSettingTab, Setting } from 'obsidian';

import type GloveboxPlugin from './main';
import type { SnippetConfigMap, SnippetMap } from './snippets';

/* eslint-disable max-lines-per-function obsidianmd/no-static-styles-assignment */

export interface PluginConfig {
  snippets: SnippetConfigMap;
}

export interface PluginConfigRuntime extends Omit<PluginConfig, 'snippets'> {
  snippets: SnippetMap;
}

export const DEFAULT_CONFIG: PluginConfig = {
  snippets: {},
};

export const pluginConfig = Facet.define<PluginConfig, PluginConfigRuntime>({
  combine: (values) => {
    const config: PluginConfig = values[0] || DEFAULT_CONFIG;
    return {
      ...config,
      snippets: Object.fromEntries(
        Object.entries(config.snippets).map(([k, v]) => [k, snippet(v)]),
      ),
    };
  },
});

export function getPluginConfig(state: EditorState): PluginConfigRuntime {
  return state.facet(pluginConfig);
}

export class MyPluginSettingTab extends PluginSettingTab {
  readonly plugin: GloveboxPlugin;
  public icon = 'scissors';

  constructor(plugin: GloveboxPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    const addSnippetRow = (container: HTMLElement, trigger: string, replacement: string) => {
      let currentTrigger = trigger;

      const snippetSetting = new Setting(container)
        .addText((text) => {
          text
            .then((c) => {
              c.inputEl.style.fontFamily = 'var(--font-monospace)';
              c.inputEl.style.fontSize = 'var(--font-smaller)';
              c.inputEl.style.width = '60%';
            })
            .setPlaceholder('Trigger')
            .setValue(trigger)
            .onChange(async (newTrigger) => {
              // re-key the entry
              const value = this.plugin.settings.snippets[currentTrigger];
              delete this.plugin.settings.snippets[currentTrigger];
              currentTrigger = newTrigger;
              this.plugin.settings.snippets[currentTrigger] = value ?? '';
              await this.plugin.saveSettings();
            });
        })
        .addText((text) => {
          text
            .then((c) => {
              c.inputEl.style.fontFamily = 'var(--font-monospace)';
              c.inputEl.style.fontSize = 'var(--font-smaller)';
              c.inputEl.style.width = '100%';
            })
            .setPlaceholder('Replacement')
            .setValue(replacement)
            .onChange(async (newReplacement) => {
              this.plugin.settings.snippets[currentTrigger] = newReplacement;
              await this.plugin.saveSettings();
            });
        })
        .addExtraButton((extraButton) => {
          extraButton.setIcon('trash').onClick(async () => {
            delete this.plugin.settings.snippets[currentTrigger];
            await this.plugin.saveSettings();
            snippetSetting.settingEl.remove();
          });
        });

      // we don't need this
      snippetSetting.infoEl.remove();
    };

    new Setting(containerEl)
      .setName('Snippets')
      .setDesc(
        createFragment((el) => {
          el.createSpan({ text: 'Define triggers and their replacements.' });
          el.createEl('br');
          el.createSpan({ text: 'See the replacement syntax ' });
          el.createEl('a', {
            text: 'here',
            href: 'https://codemirror.net/docs/ref/#autocomplete.snippet',
          });
          el.createSpan({ text: '.' });
        }),
      )
      .addButton((button) => {
        button.setButtonText('Add snippet').onClick(() => {
          addSnippetRow(containerEl, '', '');
        });
      });

    // load existing snippets on open
    for (const [trigger, replacement] of Object.entries(this.plugin.settings.snippets)) {
      addSnippetRow(containerEl, trigger, replacement);
    }
  }
}
