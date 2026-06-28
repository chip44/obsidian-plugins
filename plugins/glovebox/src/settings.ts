import { snippet } from '@codemirror/autocomplete';
import { type EditorState, Facet } from '@codemirror/state';
import { STATE_CONTEXTS } from '@shared/context';
import { setInputCode } from '@shared/dom';
import { PluginSettingTab, Setting } from 'obsidian';

import type GloveboxPlugin from './main';
import type { SnippetConfig, SnippetConfigMap, SnippetMap } from './snippets';

/* oxlint-disable max-lines-per-function */

const DEFAULT_SNIPPET_TRIGGER: keyof SnippetConfigMap = '';
const DEFAULT_SNIPPET_CONFIG: SnippetConfigMap[keyof SnippetConfigMap] = {
  replacement: '',
  scopes: [...STATE_CONTEXTS],
};

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
        Object.entries(config.snippets).map(([k, v]) => [
          k,
          { ...v, apply: snippet(v.replacement) },
        ]),
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

    const addSnippetRow = (
      container: HTMLElement,
      trigger: string,
      snippetConfig: SnippetConfig,
    ) => {
      let currentTrigger = trigger;
      let currentReplacement = snippetConfig.replacement;
      let currentScopes = snippetConfig.scopes;

      const snippetSetting = new Setting(container)
        .addText((text) => {
          text
            .then(setInputCode)
            .then((c) => {
              c.inputEl.setCssProps({ width: '60%' });
            })
            .setPlaceholder('Trigger')
            .setValue(trigger)
            .onChange(async (newTrigger) => {
              // re-key the entry
              const value = this.plugin.settings.snippets[currentTrigger];
              delete this.plugin.settings.snippets[currentTrigger];

              currentTrigger = newTrigger;

              this.plugin.settings.snippets[currentTrigger] = value ?? {
                replacement: currentReplacement,
                scopes: currentScopes,
              };
              await this.plugin.saveSettings();
            });
        })
        .addText((text) => {
          text
            .then(setInputCode)
            .then((c) => {
              c.inputEl.setCssProps({ width: '100%' });
            })
            .setPlaceholder('Replacement')
            .setValue(snippetConfig.replacement)
            .onChange(async (newReplacement) => {
              currentReplacement = newReplacement;

              if (!this.plugin.settings.snippets[currentTrigger]) return;

              this.plugin.settings.snippets[currentTrigger].replacement = newReplacement;
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
            // eslint-disable-next-line obsidianmd/ui/sentence-case
            text: 'here',
            href: 'https://codemirror.net/docs/ref/#autocomplete.snippet',
          });
          el.createSpan({ text: '.' });
          el.createEl('br');
          el.createSpan({ text: 'To change the scopes of snippets, edit ' });
          el.createEl('code', { text: 'data.json' });
          el.createSpan({ text: ' directly in the plugin folder.' });
        }),
      )
      .addButton((button) => {
        button.setButtonText('Add snippet').onClick(() => {
          addSnippetRow(containerEl, DEFAULT_SNIPPET_TRIGGER, DEFAULT_SNIPPET_CONFIG);
        });
      });

    // load existing snippets on open
    for (const [trigger, snippetConfig] of Object.entries(this.plugin.settings.snippets)) {
      addSnippetRow(containerEl, trigger, snippetConfig);
    }
  }
}
