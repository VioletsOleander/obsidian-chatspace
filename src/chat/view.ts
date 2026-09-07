import { ItemView, Notice, Scope } from "obsidian";
import { mount, unmount } from "svelte";

import Component from "./Component.svelte";

import type { WorkspaceLeaf } from "obsidian";
import type { ChatService } from "./service.svelte";

class ChatView extends ItemView {
  static viewType = "chatspace:chatview";

  private service: ChatService;
  private component!: ReturnType<typeof Component>;

  constructor(service: ChatService, leaf: WorkspaceLeaf) {
    super(leaf);

    this.service = service;
    this.icon = "message-square";
  }

  override async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.component = mount(Component, {
      target: this.contentEl,
      props: {
        view: this,
        service: this.service,
      },
    });

    // We only need to assign it to this.scope
    // Obsidian will handle the lifecycle on view focus and unfocus
    this.scope = new Scope(this.app.scope);

    this.scope.register(["Ctrl"], "j", () => {
      // @ts-ignore tsc can not reconginze svelte component type
      this.component.scrollDown(); // eslint-disable-line

      return false;
    });
    this.scope.register(["Ctrl"], "k", () => {
      // @ts-ignore tsc can not reconginze svelte component type
      this.component.scrollUp(); // eslint-disable-line

      return false;
    });
    this.scope.register(["Ctrl"], "l", () => {
      // @ts-ignore tsc can not reconginze svelte component type
      this.component.focusInputBox(); // eslint-disable-line

      return false;
    });
    this.scope.register(["Ctrl", "Shift"], "n", () => {
      // @ts-ignore tsc can not reconginze svelte component type
      this.component.newChat(); // eslint-disable-line
    });
  }

  override async onClose(): Promise<void> {
    unmount(this.component).catch(() => {
      new Notice("Faild to unmount the component");
    });
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
