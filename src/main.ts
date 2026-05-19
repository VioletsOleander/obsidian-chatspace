import { Plugin, WorkspaceLeaf } from "obsidian";
import type { ChatSpaceSetting } from "./setting";
import { ChatSpaceSettingTab, DEFAULT_SETTING } from "./setting";
import { ChatView } from "./view/chat";

class ChatSpace extends Plugin {
  setting!: ChatSpaceSetting;

  /** Initialize the plugin.
   *
   * The initialization involves:
   * - load setting
   * - register command
   */
  override async onload(): Promise<void> {
    console.debug("Loading ChatSpace plugin");

    await this.loadSettings();
    this.addSettingTab(new ChatSpaceSettingTab(this.app, this));

    this.registerView(ChatView.viewType, (leaf) => new ChatView(leaf));
    this.addCommand({
      id: "toggle-chat",
      name: "Toggle chat",
      callback: () => {
        this.activateView(ChatView.viewType).catch(() => {
          console.debug("Failed to activate view");
        });
      },
    });
  }

  override onunload(): void {
    console.debug("Unloading ChatSpace plugin");
  }

  /** Save settings to `data.json`. */
  async saveSettings(): Promise<void> {
    await this.saveData(this.setting);
  }

  /** Load `this.setting` from `data.json` or default values. */
  private async loadSettings(): Promise<void> {
    // Later source overwrite earlier ones
    const loadedSetting = (await this.loadData()) as Partial<ChatSpaceSetting>;
    this.setting = {
      ...DEFAULT_SETTING,
      ...loadedSetting,
    };
  }

  /** Reveal existing view or create a new one. */
  private async activateView(viewType: string): Promise<void> {
    const workspace = this.app.workspace;
    const firstLeaf = workspace.getLeavesOfType(viewType)[0];

    let leaf: WorkspaceLeaf;

    if (firstLeaf === undefined) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: viewType, active: true });
    } else {
      leaf = firstLeaf;
    }

    await workspace.revealLeaf(leaf);
  }
}

export { ChatSpace as default };
