import { Notice, PluginSettingTab, SecretComponent, Setting as SettingItem } from "obsidian";

import type { App, TextAreaComponent, TextComponent } from "obsidian";
import type { ChatSpace } from "./main";

interface Setting {
  apiKey: string;
  baseURL: string;
  modelName: string;
  prompts: string;
}

class SettingTab extends PluginSettingTab {
  private plugin: ChatSpace;

  constructor(app: App, plugin: ChatSpace) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /** Add plugin settings when the tab is rendered. */
  display(): void {
    this.containerEl.empty();

    this.addSecretItem(
      "Api Key",
      "Example: sk-thisIsAnExampleApiKey",
      (element: HTMLElement) => {
        const component = new SecretComponent(this.app, element);
        return component
          .setValue(this.plugin.setting.apiKey)
          .onChange(async (value: string) => {
            await this.updateSetting("apiKey", value);
            this.updateClient();
          });
      },
    );

    this.addTextItem(
      "Base URL",
      "OpenAI format. Example: https://dashscope.aliyuncs.com/compatible-mode/v1",
      (component: TextComponent) => {
        component
          .setValue(this.plugin.setting.baseURL)
          .onChange(async (value: string) => {
            await this.updateSetting("baseURL", value);
            this.updateClient();
          });
      },
    );
    this.addTextItem(
      "Model Name",
      "Example: qwen-flash",
      (component: TextComponent) => {
        component
          .setValue(this.plugin.setting.baseURL)
          .onChange(async (value: string) => {
            await this.updateSetting("modelName", value);
            this.updateModel();
          });
      },
    );

    this.addTextAreaItem(
      "Prompts",
      "Array of {<name>: <content>} object. "
        + "Example: [{\"name\": \"explain\": \"content\": \"explain the following content\"}]",
      (component: TextAreaComponent) => {
        component
          .setValue(this.plugin.setting.prompts)
          .onChange(async (value: string) => {
            return this.updateSetting("prompts", value);
          });
      },
    );
  }
  private async updateSetting(key: keyof Setting, value: string): Promise<void> {
    this.plugin.setting[key] = value;
    return this.plugin.saveSetting().catch(() => {
      new Notice("Failed to save setting");
    });
  }

  private updateClient(): void {
    this.plugin.service?.updateClient();
  }

  private updateModel(): void {
    this.plugin.service?.updateModel();
  }

  private makeItem(name: string, desc: string): SettingItem {
    const item = new SettingItem(this.containerEl);

    return item.setName(name).setDesc(desc);
  }

  /**
   * Add a secret setting item.
   *
   * Populate the item with plugin setting value and add a save on modification watcher for it.
   *
   * @param name Name of the secret setting
   * @param desc Description of the secret setting
   * @param makeSecret Callback on opening the secret item in setting tab
   */
  private addSecretItem(
    name: string,
    desc: string,
    makeSecret: (element: HTMLElement) => SecretComponent,
  ): void {
    const item = this.makeItem(name, desc);
    item.addComponent(makeSecret);
  }

  /**
   * Add a text setting item.
   *
   * Populate the item with plugin setting value and add a save on modification watcher for it.
   *
   * @param name Name of the text setting
   * @param desc Description of the text setting
   * @param onAddText Callback on setting component being added
   */
  private addTextItem(
    name: string,
    desc: string,
    onAddText: (component: TextComponent) => void,
  ): void {
    const item = this.makeItem(name, desc);
    item.addText(onAddText);
  }

  /**
   * Add a text area setting item.
   *
   * Populate the item with plugin setting value and add a save on modification watcher for it.
   *
   * @param name Name of the text setting
   * @param desc Description of the text setting
   * @param onAddTextArea Callback on setting component being added
   */
  private addTextAreaItem(
    name: string,
    desc: string,
    onAddTextArea: (component: TextAreaComponent) => void,
  ): void {
    const item = this.makeItem(name, desc);
    item.addTextArea(onAddTextArea);
  }
}

export type { Setting };
export { SettingTab };
