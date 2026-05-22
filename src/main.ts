import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTING, SettingTab } from "./setting";
import { ChatView } from "./view";

import type { Setting } from "./setting";

class ChatSpace extends Plugin {
  setting!: Setting;

  /** Initialize the plugin.
   *
   * The initialization involves:
   *
   * - load setting
   * - register view
   * - register commands
   */
  override async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new SettingTab(this.app, this));

    this.registerView(ChatView.viewType, (leaf) => new ChatView(leaf, this.setting, this.app.secretStorage));

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

  /** Save settings to `data.json`. */
  async saveSettings(): Promise<void> {
    await this.saveData(this.setting);
  }

  /** Load `this.setting` from `data.json` or default values. */
  private async loadSettings(): Promise<void> {
    // Later source overwrite earlier ones
    const loadedSetting = (await this.loadData()) as Partial<Setting>;
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
