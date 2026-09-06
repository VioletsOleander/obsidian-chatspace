import { ChatView } from "@/chat/view";
import { Notice } from "obsidian";

import type { ChatSpace } from "@/main";
import type { WorkspaceLeaf } from "obsidian";

/** Reveal existing `viewType` view or create a new `viewType` view. */
async function activateView(plugin: ChatSpace, viewType: string): Promise<void> {
  const workspace = plugin.app.workspace;
  const firstLeaf = workspace.getLeavesOfType(viewType)[0];

  let leaf: WorkspaceLeaf;

  if (firstLeaf === undefined) {
    leaf = workspace.getLeaf(true);
    await leaf.setViewState({ type: viewType, active: true });
  } else {
    leaf = firstLeaf;
  }

  return workspace.revealLeaf(leaf);
}

/** Reveal existing chat view or create a new chat view. */
async function toggleChat(plugin: ChatSpace): Promise<void> {
  await activateView(plugin, ChatView.viewType).catch(() => new Notice("Failed to activate view"));
}

export { activateView, toggleChat };
