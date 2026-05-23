import { ItemView } from "obsidian";
import { mount, unmount } from "svelte";
import Component from "./Component.svelte";

import type ChatSpace from "@/main";
import type { Setting } from "@/setting";
import type { SecretStorage, WorkspaceLeaf } from "obsidian";

interface Props {
  setting: Setting;
  secret: SecretStorage;
}

class ChatView extends ItemView {
  static viewType = "chatspace:chatview";
  private plugin: ChatSpace;
  private component: ReturnType<typeof mount> | undefined;

  constructor(leaf: WorkspaceLeaf, plugin: ChatSpace) {
    super(leaf);
    this.plugin = plugin;
    this.icon = "message-square";
  }

  /** Return the unique identifier of the view. */
  getViewType(): string {
    return ChatView.viewType;
  }

  /** Return the human readable name of the view.
   *
   * This name will be displayed as the tab name and
   * also displayed as the header of the view.
   */
  getDisplayText(): string {
    return "Chat view";
  }

  override async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();

    const props: Props = {
      setting: this.plugin.setting,
      secret: this.plugin.app.secretStorage,
    };

    this.component = mount(Component, {
      target: container,
      props: props,
    });
  }

  override async onClose(): Promise<void> {
    if (this.component) {
      return unmount(this.component).catch(() => {
        console.debug("Faild to unmount the component");
      });
    }
  }
}

export { ChatView };
export type { Props };
