import { Plugin } from "obsidian";
import { applyPrompt } from "./commands/prompt";
import { toggleChat } from "./commands/toggle";
import { DEFAULT_SETTING, SettingTab } from "./setting";
import { ChatView } from "./view/chat";

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

    this.registerView(ChatView.viewType, (leaf) => new ChatView(leaf, this));

    this.addCommand({
      id: "toggle-chat",
      name: "Toggle chat",
      callback: () => {
        toggleChat(this);
      },
    });
    this.addCommand({
      id: "apply-prompt",
      name: "Apply prompt",
      editorCallback: (editor, _) => {
        applyPrompt(this, editor);
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
}

export default ChatSpace;
export { ChatSpace };
