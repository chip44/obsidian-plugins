import type { EditorState } from '@codemirror/state';
import { getStateContext } from '@shared/context';

import type { SnippetConfigMap } from './snippets';

export function getEnabledSnippetsForContext(
  state: EditorState,
  snippets: SnippetConfigMap,
): SnippetConfigMap {
  const scope = getStateContext(state).context;
  return Object.fromEntries(
    Object.entries(snippets).filter(([_, snippetConfig]) => snippetConfig.scopes.includes(scope)),
  );
}
