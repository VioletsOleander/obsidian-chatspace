import { Plugin } from "obsidian";

import { ChatService } from "./chat/service.svelte";
import { ChatView } from "./chat/view";
import { applyPrompt } from "./commands/prompt";
import { toggleChat } from "./commands/toggle";
import { SettingTab } from "./setting";

import type { App, PluginManifest } from "obsidian";
import type { Setting } from "./setting";

class ChatSpace extends Plugin {
  setting: Setting;
  service!: ChatService;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    this.setting = {
      apiKey: "",
      baseURL: "",
      modelName: "",
      prompts: "",
    };
  }

  override async onload(): Promise<void> {
    await this.loadSetting();

    this.addSettingTab(new SettingTab(this.app, this));

    this.registerView(
      ChatView.viewType,
      (leaf) => {
        return new ChatView(this.service, leaf);
      },
    );

    this.addCommand({
      id: "toggle-chat",
      name: "Toggle chat",
      callback: async () => {
        await toggleChat(this);
      },
    });
    this.addCommand({
      id: "apply-prompt",
      name: "Apply prompt",
      editorCallback: (editor, _) => {
        applyPrompt(this, editor);
      },
    });

    this.service = new ChatService({
      apiKey: this.setting.apiKey,
      baseURL: this.setting.baseURL,
      modelName: this.setting.modelName,
    }, this.app.secretStorage);
  }

  /** Save settings to `data.json`. */
  async saveSetting(): Promise<void> {
    await this.saveData(this.setting);
  }

  /** Load `this.setting` from `data.json` or default values. */
  private async loadSetting(): Promise<void> {
    // Later source overwrite earlier ones
    const loadedSetting = (await this.loadData()) as Partial<Setting>;
    this.setting = {
      ...this.setting,
      ...loadedSetting,
    };
  }
}

export default ChatSpace;
export { ChatSpace };
