import { type EditorView } from '@codemirror/view';
import { getNodeElement, getStateContext } from '@shared/context';

import { getPluginConfig, getRuntimeData } from './settings';

export function isEnabledForContext(view: EditorView): boolean {
  const state = view.state;

  const nodeContext = getStateContext(state);
  if (!nodeContext) return false;

  const config = getPluginConfig(state);

  // skip if disabled for this *type* of block
  if (nodeContext.context === 'math' && !config.mathBlocks) return false;
  if (nodeContext.context === 'code' && !config.codeBlocks) return false;

  // skip if disabled for this *specific* block
  const runtimeData = getRuntimeData(view);
  const element = getNodeElement(view, nodeContext.node);
  if (element && runtimeData?.blacklistedNodes.has(element)) return false;

  return true;
}
