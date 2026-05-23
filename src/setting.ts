import { PluginSettingTab, SecretComponent, Setting as SettingItem } from "obsidian";

import type { App, TextAreaComponent, TextComponent } from "obsidian";
import type ChatSpace from "./main";

interface Setting {
  apiKey: string;
  baseURL: string;
  modelName: string;
  prompts: string;
}

const DEFAULT_SETTING: Setting = {
  apiKey: "",
  baseURL: "",
  modelName: "",
  prompts: "",
};

type settingUpdater = (value: string) => Promise<void>;

class SettingTab extends PluginSettingTab {
  private plugin: ChatSpace;

  constructor(app: App, plugin: ChatSpace) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /** Add plugin settings when the tab is rendered. */
  display(): void {
    const container = this.containerEl;
    container.empty();

    this.addSecretItem(container, "Api Key", "Example: sk-thisIsAnExampleApiKey", "apiKey");

    this.addTextItem(
      container,
      "Base URL",
      "OpenAI format. Example: https://dashscope.aliyuncs.com/compatible-mode/v1",
      "baseURL",
    );
    this.addTextItem(container, "Model Name", "Example: qwen-flash", "modelName");

    this.addTextAreaItem(
      container,
      "Prompts",
      "Array of {<name>: <content>} object. Example: [{\"name\": \"explain\": \"content\": \"explain the following content\"}]",
      "prompts",
    );
  }

  /** Create a `SettingItem` under `container` and return it. */
  private makeItem(container: HTMLElement, name: string, desc: string): SettingItem {
    const item = new SettingItem(container);

    return item.setName(name).setDesc(desc);
  }

  /** Create and return an async updater for the setting identified by `key`. */
  private makeUpdater(key: keyof Setting): settingUpdater {
    return async (value: string): Promise<void> => {
      this.plugin.setting[key] = value;
      await this.plugin.saveSettings();
    };
  }

  /**
   * Add a secret setting item.
   *
   * Populate the item with plugin setting value and add a save on modification watcher for it.
   *
   * @param container The container element to hold the text setting
   * @param name Name of the secret setting
   * @param desc Description of the secret setting
   * @param key Key name of the secret setting
   */
  private addSecretItem(
    container: HTMLElement,
    name: string,
    desc: string,
    key: keyof Setting,
  ): void {
    const item = this.makeItem(container, name, desc);
    const makeComponent = (element: HTMLElement): SecretComponent => {
      const component = new SecretComponent(this.app, element);
      return component.setValue(this.plugin.setting[key]).onChange(this.makeUpdater(key));
    };

    item.addComponent(makeComponent);
  }

  /**
   * Add a text setting item.
   *
   * Populate the item with plugin setting value and add a save on modification watcher for it.
   *
   * @param container The container element to hold the text setting
   * @param name Name of the text setting
   * @param desc Description of the text setting
   * @param key Key name of the text setting
   */
  private addTextItem(
    container: HTMLElement,
    name: string,
    desc: string,
    key: keyof Setting,
  ): void {
    const item = this.makeItem(container, name, desc);
    const onAddText = (component: TextComponent): void => {
      component.setValue(this.plugin.setting[key]).onChange(this.makeUpdater(key));
    };

    item.addText(onAddText);
  }

  /**
   * Add a text area setting item.
   *
   * Populate the item with plugin setting value and add a save on modification watcher for it.
   *
   * @param container The container element to hold the text setting
   * @param name Name of the text setting
   * @param desc Description of the text setting
   * @param key Key name of the text setting
   */
  private addTextAreaItem(
    container: HTMLElement,
    name: string,
    desc: string,
    key: keyof Setting,
  ): void {
    const item = this.makeItem(container, name, desc);
    const onAddTextArea = (component: TextAreaComponent): void => {
      component.setValue(this.plugin.setting[key]).onChange(this.makeUpdater(key));
    };

    item.addTextArea(onAddTextArea);
  }
}

export type { Setting };
export { DEFAULT_SETTING, SettingTab };
