import { snippet } from '@codemirror/autocomplete';
import { type EditorState, Facet } from '@codemirror/state';
import { STATE_CONTEXTS } from '@shared/context';
import { setInputCode } from '@shared/dom';
import { capitalize } from '@shared/utils';
import { PluginSettingTab, SettingGroup } from 'obsidian';

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

export class GloveboxPluginSettingTab extends PluginSettingTab {
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
      settingGroup: SettingGroup,
      trigger: string,
      snippetConfig: SnippetConfig,
    ) => {
      let currentTrigger = trigger;
      let currentReplacement = snippetConfig.replacement;
      let currentScopes = snippetConfig.scopes;

      settingGroup.addSetting((setting) => {
        setting
          .setNoInfo()
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
          .addDropdown((dropdown) => {
            dropdown.selectEl.multiple = true;
            dropdown.selectEl.size = 1;
            for (const scope of STATE_CONTEXTS) {
              dropdown.addOption(scope, capitalize(scope));
            }
            for (const opt of dropdown.selectEl.options) {
              // @ts-expect-error
              opt.selected = currentScopes.includes(opt.value);
            }
            dropdown.onChange(async () => {
              const selectedScopes = Array.from(dropdown.selectEl.selectedOptions).map(
                (o) => o.value,
              );
              // @ts-expect-error
              currentScopes = selectedScopes;
              this.plugin.settings.snippets[currentTrigger].scopes = currentScopes;
              await this.plugin.saveSettings();
            });
          })
          .addExtraButton((extraButton) => {
            extraButton
              .setIcon('trash')
              .setTooltip('Delete snippet')
              .onClick(async () => {
                delete this.plugin.settings.snippets[currentTrigger];
                await this.plugin.saveSettings();
                setting.settingEl.remove();
              });
          });
      });
    };

    const settingGroup = new SettingGroup(containerEl).addSetting((setting) => {
      setting
        .setHeading()
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
          }),
        )
        .addButton((button) => {
          button.setButtonText('Add snippet').onClick(() => {
            addSnippetRow(settingGroup, DEFAULT_SNIPPET_TRIGGER, DEFAULT_SNIPPET_CONFIG);
          });
        });
    });

    // load existing snippets on open
    for (const [trigger, snippetConfig] of Object.entries(this.plugin.settings.snippets)) {
      addSnippetRow(settingGroup, trigger, snippetConfig);
    }
  }
}
