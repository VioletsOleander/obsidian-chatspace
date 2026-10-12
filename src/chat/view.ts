import { ItemView, Notice, Scope } from "obsidian";
import { mount, unmount } from "svelte";

import Component from "./Component.svelte";

import type { WorkspaceLeaf } from "obsidian";
import type { ChatService } from "./service.svelte";

export class ChatView extends ItemView {
  static viewType = "chatspace:chatview";

  #service: ChatService;
  #component!: ReturnType<typeof Component>;

  constructor(service: ChatService, leaf: WorkspaceLeaf) {
    super(leaf);

    this.#service = service;
    this.icon = "message-square";
  }

  override async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.#component = mount(Component, {
      target: this.contentEl,
      props: {
        view: this,
        service: this.#service,
      },
    });

    this.#bindKeys();
  }

  override async onClose(): Promise<void> {
    unmount(this.#component).catch(() => {
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

  #bindKeys() {
    // We only need to assign it to this.scope
    // Obsidian will handle the lifecycle on view focus and unfocus
    this.scope = new Scope(this.app.scope);

    // Scroll keys.
    this.scope.register(["Ctrl"], "j", () => {
      // @ts-ignore
      this.#component.scrollDown(0.1); // eslint-disable-line

      return false;
    });
    this.scope.register(["Ctrl"], "k", () => {
      // @ts-ignore
      this.#component.scrollUp(0.1); // eslint-disable-line

      return false;
    });

    this.scope.register(["Ctrl"], "e", () => {
      // @ts-ignore
      this.#component.scrollDown(0.1); // eslint-disable-line

      return false;
    });
    this.scope.register(["Ctrl"], "y", () => {
      // @ts-ignore
      this.#component.scrollUp(0.1); // eslint-disable-line

      return false;
    });

    this.scope.register(["Ctrl"], "d", () => {
      // @ts-ignore
      this.#component.scrollDown(0.5); // eslint-disable-line

      return false;
    });
    this.scope.register(["Ctrl"], "u", () => {
      // @ts-ignore
      this.#component.scrollUp(0.5); // eslint-disable-line

      return false;
    });

    this.scope.register(["Ctrl"], "i", () => {
      // @ts-ignore
      this.#component.focusInputBox(); // eslint-disable-line

      return false;
    });

    this.scope.register(["Ctrl"], "c", () => {
      const content = this.#service.getExchanges().last()?.reply;

      if (content === undefined) {
        new Notice("No existing reply to copy");
        return false;
      }

      navigator.clipboard.writeText(content)
        .then(() => new Notice("Copied message"))
        .catch(() => new Notice("Failed to copy message"));

      return false;
    });

    this.scope.register(["Ctrl", "Shift"], "n", () => {
      this.#service.refresh();

      return false;
    });
  }
}
