import { ItemView, Notice } from "obsidian";
import { mount, unmount } from "svelte";
import { ChatService } from "./service.svelte";

import Component from "./Component.svelte";

import type { ChatSpace } from "@/main";
import type { WorkspaceLeaf } from "obsidian";

interface Props {
  service: ChatService;
}

class ChatView extends ItemView {
  static viewType = "chatspace:chatview";

  private plugin: ChatSpace;
  private component: ReturnType<typeof mount> | null;

  constructor(plugin: ChatSpace, leaf: WorkspaceLeaf) {
    super(leaf);
    this.plugin = plugin;
    this.icon = "message-square";

    this.component = null;
  }

  override async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();

    this.plugin.service ??= new ChatService(this.plugin);
    this.component = mount(Component, {
      target: container,
      props: { service: this.plugin.service },
    });
  }

  override async onClose(): Promise<void> {
    if (this.component !== null) {
      return unmount(this.component).catch(() => {
        new Notice("Faild to unmount the component");
      });
    }
  }

  /** Return the unique identifier of the view. */
  getViewType(): string {
    return ChatView.viewType;
  }

  /** Return the text to be displayed as the tab name and header for the view. */
  getDisplayText(): string {
    return "Chat view";
  }
}

export { ChatView };
export type { Props };
