import { snippet } from '@codemirror/autocomplete';
import { isolateHistory } from '@codemirror/commands';
import { EditorState, StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { StateContext } from '@shared/context';

import { getEnabledSnippetsForContext } from './context';
import { getPluginConfig } from './settings';

export interface SnippetConfig {
  trigger: string;
  replacement: string;
  scopes: StateContext[];
}

export interface Snippet extends SnippetConfig {
  apply: ReturnType<typeof snippet>;
}

interface SnippetEffect {
  trigger: string;
  from: number;
  to: number;
}

const snippetEffect = StateEffect.define<SnippetEffect>();

export const snippetTrigger = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged || !tr.isUserEvent('input.type')) return tr;

  const pos = tr.newSelection.main.head;
  const line = tr.newDoc.lineAt(pos);
  const text = line.text.slice(0, pos - line.from);

  const config = getPluginConfig(tr.startState);
  const enabledSnippets = getEnabledSnippetsForContext(tr.startState, config.snippets);

  // check all triggers, longest match wins
  let matched: string | undefined;
  for (const { trigger } of enabledSnippets) {
    if (
      trigger.length > (matched?.length ?? 0) &&
      text.endsWith(trigger) &&
      !text.endsWith(`\\${trigger}`)
    ) {
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
      const s = config.snippets.find((x) => x.trigger === trigger);
      if (!s) continue;

      s.apply(update.view, null, from, to);
      return;
    }
  }
});
