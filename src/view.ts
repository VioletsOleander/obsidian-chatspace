import { ItemView, SecretStorage } from "obsidian";
import { mount, unmount } from "svelte";
import Component from "./Component.svelte";

import type { WorkspaceLeaf } from "obsidian";
import type { Setting } from "./setting";

class ChatView extends ItemView {
  static viewType = "chatspace:chatview";
  private setting: Setting;
  private secretStorage: SecretStorage;
  private component: ReturnType<typeof mount> | undefined;

  constructor(leaf: WorkspaceLeaf, setting: Setting, secretStorage: SecretStorage) {
    super(leaf);
    this.setting = setting;
    this.secretStorage = secretStorage;
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

    this.component = mount(Component, {
      target: container,
      props: { setting: this.setting, secretStorage: this.secretStorage },
    });
  }

  override async onClose(): Promise<void> {
    if (this.component) {
      unmount(this.component).catch(() => {
        console.debug("Faild to unmount the component");
      });
    }
  }
}

export { ChatView };
