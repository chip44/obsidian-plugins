import { snippet } from '@codemirror/autocomplete';
import { type EditorState, Facet } from '@codemirror/state';
import { STATE_CONTEXTS } from '@shared/context';
import { setInputCode } from '@shared/dom';
import { capitalize } from '@shared/utils';
import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';

import type GloveboxPlugin from './main';
import type { Snippet, SnippetConfig } from './snippets';

/* oxlint-disable eslint/max-lines-per-function */

export interface PluginConfig {
  snippets: SnippetConfig[];
}

export interface PluginConfigRuntime extends Omit<PluginConfig, 'snippets'> {
  snippets: Snippet[];
}

export const DEFAULT_CONFIG: PluginConfig = {
  snippets: [],
};

export const pluginConfig = Facet.define<PluginConfig, PluginConfigRuntime>({
  combine: (values) => {
    const config: PluginConfig = values[0] || DEFAULT_CONFIG;
    return {
      ...config,
      snippets: config.snippets.map((s) => ({
        trigger: s.trigger,
        replacement: s.replacement,
        scopes: s.scopes,
        apply: snippet(s.replacement),
      })),
    };
  },
});

export function getPluginConfig(state: EditorState): PluginConfigRuntime {
  return state.facet(pluginConfig);
}

export class GloveboxPluginSettingTab extends PluginSettingTab {
  readonly plugin: GloveboxPlugin;
  public icon = 'scissors';

  constructor(plugin: GloveboxPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: 'list',
        heading: 'Snippets',
        desc: createFragment((el) => {
          el.createSpan({ text: 'Define triggers and their replacements.' });
          el.createEl('br');
          el.createSpan({ text: 'See the replacement syntax ' });
          el.createEl('a', {
            // eslint-disable-next-line obsidianmd/ui/sentence-case -- mid-sentence link, shouldn't be capitalized
            text: 'here',
            href: 'https://codemirror.net/docs/ref/#autocomplete.snippet',
          });
          el.createSpan({ text: '.' });
        }),
        emptyState: 'No snippets yet.',
        addItem: {
          name: 'Add snippet',
          action: () => {
            this.plugin.settings.snippets.push({
              trigger: '',
              replacement: '',
              scopes: [...STATE_CONTEXTS],
            });
            void this.plugin.saveSettings();
            this.update();
          },
        },
        onReorder: (oldIndex, newIndex) => {
          let snippets = this.plugin.settings.snippets;
          let [moved] = snippets.splice(oldIndex, 1);
          snippets.splice(newIndex, 0, moved);
          void this.plugin.saveSettings();
          this.update();
        },
        onDelete: (idx) => {
          this.plugin.settings.snippets.splice(idx, 1);
          void this.plugin.saveSettings();
          this.update();
        },
        items: this.plugin.settings.snippets.map((s, i) => ({
          name: '',
          searchable: false,
          render: (setting) => {
            setting
              .addText((text) => {
                text
                  .then(setInputCode)
                  .then((c) => {
                    c.inputEl.setCssProps({ width: '60%' });
                  })
                  .setPlaceholder('Trigger')
                  .setValue(s.trigger)
                  .onChange(async (value) => {
                    this.plugin.settings.snippets[i].trigger = value;
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
                  .setValue(s.replacement)
                  .onChange(async (value) => {
                    this.plugin.settings.snippets[i].replacement = value;
                    await this.plugin.saveSettings();
                  });
              })
              .addDropdown((dropdown) => {
                dropdown.selectEl.multiple = true;
                dropdown.selectEl.size = 1;
                for (const scope of STATE_CONTEXTS) {
                  dropdown.addOption(scope, capitalize(scope));
                }
                for (const opt of dropdown.selectEl.options) {
                  // @ts-expect-error: string to narrower-string conversion
                  opt.selected = s.scopes.includes(opt.value);
                }
                dropdown.onChange(async () => {
                  const selectedScopes = Array.from(dropdown.selectEl.selectedOptions).map(
                    (o) => o.value,
                  );
                  // @ts-expect-error: always valid
                  this.plugin.settings.snippets[i].scopes = selectedScopes;
                  await this.plugin.saveSettings();
                });
              });

            // we don't need this
            setting.infoEl.remove();
          },
        })),
      },
    ];
  }
}
