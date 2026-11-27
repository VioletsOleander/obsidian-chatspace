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
    const scope = new Scope(this.app.scope);

    this.#bindScrollKeys(scope);
    scope.register(["Ctrl"], "i", () => {
      // @ts-ignore
      this.#component.focusInputBox(); // eslint-disable-line

      return false;
    });

    scope.register(["Ctrl"], "c", () => {
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

    scope.register(["Ctrl", "Shift"], "n", () => {
      this.#service.refresh();

      return false;
    });

    // We only need to assign it to this.scope
    // Obsidian will handle the lifecycle on view focus and unfocus
    this.scope = scope;
  }

  #bindScrollKeys(scope: Scope) {
    const keysToValue = new Map<[string, string], number>(
      [
        [["j", "k"], 0.1],
        [["e", "y"], 0.3],
        [["d", "u"], 0.5],
        [["f", "b"], 1],
      ],
    );

    for (const [keys, value] of keysToValue) {
      scope.register(["Ctrl"], keys[0], () => {
        // @ts-ignore
        this.#component.scrollDown(value); // eslint-disable-line

        return false;
      });

      scope.register(["Ctrl"], keys[1], () => {
        // @ts-ignore
        this.#component.scrollUp(value); // eslint-disable-line

        return false;
      });
    }
  }
}
