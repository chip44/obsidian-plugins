import { type EditorView } from '@codemirror/view';
import { getNodeElement, getStateContext } from '@shared/context';
import { type Editor, type MarkdownFileInfo, MarkdownView, type Menu } from 'obsidian';

import { getPluginConfig, getRuntimeData } from './settings';

export function onContextMenu(
  menu: Menu,
  editor: Editor,
  view: MarkdownView | MarkdownFileInfo,
): void {
  if (!(view instanceof MarkdownView)) return;

  // @ts-expect-error: conflicts with obsidian-typings
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const editorView = editor.cm as EditorView;

  const config = getPluginConfig(editorView.state);
  if (!config.contextMenu) return;

  const blacklistedNodes = getRuntimeData(editorView)?.blacklistedNodes;
  if (!blacklistedNodes) return;

  const nodeContext = getStateContext(editorView.state);
  if (!nodeContext) return;
  const element = getNodeElement(editorView, nodeContext.node);
  if (!element) return;

  const isBlacklisted = blacklistedNodes.has(element);
  if (isBlacklisted) {
    menu.addItem((item) =>
      item
        .setTitle('Enable Keystone for this block')
        .setIcon('keyboard')
        .onClick(() => blacklistedNodes.delete(element)),
    );
  } else {
    menu.addItem((item) =>
      item
        .setTitle('Disable Keystone for this block')
        .setIcon('keyboard-off')
        .onClick(() => blacklistedNodes.add(element)),
    );
  }
}
