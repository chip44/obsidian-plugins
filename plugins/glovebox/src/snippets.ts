import { snippet } from '@codemirror/autocomplete';
import { isolateHistory } from '@codemirror/commands';
import { EditorState, StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { getPluginConfig } from './settings';

export type SnippetConfigMap = Record<string, string>;

export type SnippetMap = Record<string, ReturnType<typeof snippet>>;

interface SnippetEffect {
  trigger: string;
  from: number;
  to: number;
}

const snippetEffect = StateEffect.define<SnippetEffect>();

export const snippetTrigger = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged || !tr.isUserEvent('input.type')) return tr;

  const config = getPluginConfig(tr.startState);

  const pos = tr.newSelection.main.head;
  const line = tr.newDoc.lineAt(pos);
  const text = line.text.slice(0, pos - line.from);

  // check all triggers, longest match wins
  let matched: string | undefined;
  for (const trigger of Object.keys(config.snippets)) {
    if (text.endsWith(trigger) && (!matched || trigger.length > matched.length)) {
      matched = trigger;
    }
  }
  if (!matched) return tr;

  return [
    tr,
    {
      effects: snippetEffect.of({ trigger: matched, from: pos - matched.length, to: pos }),
      annotations: isolateHistory.of('full'),
    },
  ];
});

export const snippetRunner = EditorView.updateListener.of((update) => {
  for (const tr of update.transactions) {
    for (const effect of tr.effects) {
      if (!effect.is(snippetEffect)) continue;

      const { trigger, from, to } = effect.value;
      const config = getPluginConfig(tr.startState);
      const expand = config.snippets[trigger];
      if (!expand) continue;

      expand(update.view, null, from, to);
      return;
    }
  }
});
