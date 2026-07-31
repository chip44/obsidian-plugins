import type { EditorState } from '@codemirror/state';
import { getStateContext } from '@shared/context';

import type { SnippetConfig } from './snippets';

export function getEnabledSnippetsForContext(
  state: EditorState,
  snippets: SnippetConfig[],
): SnippetConfig[] {
  const scope = getStateContext(state).context;
  return snippets.filter((s) => s.scopes.includes(scope));
}
