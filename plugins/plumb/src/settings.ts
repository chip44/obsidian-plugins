import { capitalize } from '@shared/utils';
import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';

import type PlumbPlugin from './main';

const emphasisKinds = ['asterisks', 'underscores'] as const;
type EmphasisKind = (typeof emphasisKinds)[number];

const listMarkerKinds = ['dashes', 'asterisks'] as const;
type ListMarkerKind = (typeof listMarkerKinds)[number];

export interface PluginConfig {
  formatOnSave: boolean;
  showNotice: boolean;
  emphasisKind: EmphasisKind;
  strongKind: EmphasisKind;
  unorderedListMarker: ListMarkerKind;
  maxBlankLines: number;
}

export const DEFAULT_CONFIG: PluginConfig = {
  formatOnSave: false,
  showNotice: true,
  emphasisKind: 'underscores',
  strongKind: 'asterisks',
  unorderedListMarker: 'dashes',
  maxBlankLines: 1,
};

export class PlumbPluginSettingTab extends PluginSettingTab {
  readonly plugin: PlumbPlugin;
  public icon = 'wand-sparkles';

  constructor(plugin: PlumbPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  // oxlint-disable-next-line max-lines-per-function
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Format on save',
        control: {
          type: 'toggle',
          key: 'formatOnSave',
        },
      },
      {
        name: 'Show notice after format',
        control: {
          type: 'toggle',
          key: 'showNotice',
        },
      },
      {
        type: 'group',
        heading: 'Format configuration',
        items: [
          {
            name: 'Emphasis symbol',
            desc: 'Character to use for emphasis/italics.',
            control: {
              type: 'dropdown',
              key: 'emphasisKind',
              options: Object.fromEntries(emphasisKinds.map((v) => [v, capitalize(v)])),
              defaultValue: DEFAULT_CONFIG.emphasisKind,
            },
          },
          {
            name: 'Strong symbol',
            desc: 'Character to use for strong emphasis/bold.',
            control: {
              type: 'dropdown',
              key: 'strongKind',
              options: Object.fromEntries(emphasisKinds.map((v) => [v, capitalize(v)])),
              defaultValue: DEFAULT_CONFIG.strongKind,
            },
          },
          {
            name: 'Unordered list marker',
            desc: "Character to use for unordered list's items.",
            control: {
              type: 'dropdown',
              key: 'unorderedListMarker',
              options: Object.fromEntries(listMarkerKinds.map((v) => [v, capitalize(v)])),
              defaultValue: DEFAULT_CONFIG.unorderedListMarker,
            },
          },
          {
            name: 'Maximum blank lines',
            desc: 'Maximum number of consecutive blank lines to keep between blocks.',
            control: {
              type: 'number',
              key: 'maxBlankLines',
              defaultValue: DEFAULT_CONFIG.maxBlankLines,
              min: 0,
            },
          },
        ],
      },
    ];
  }
}
