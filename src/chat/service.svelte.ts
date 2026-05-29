import { Notice } from "obsidian";

import OpenAI from "openai";

import type { ChatSpace } from "@/main";

interface Exchange {
  query: string;
  reply: string;
}

class ChatService {
  private plugin: ChatSpace;

  private exchanges: Exchange[];
  private waiting: boolean;

  private client: OpenAI;
  private model: string;
  private prevResponseId: string | null;

  private abortController: AbortController | null;

  constructor(plugin: ChatSpace) {
    this.plugin = plugin;

    this.exchanges = $state([]);
    this.waiting = $state(false);

    this.client = this.makeClient();
    this.model = plugin.setting.modelName;
    this.prevResponseId = null;

    this.abortController = null;
  }

  /** Send content and asynchronously wait for response. **/
  async send(content: string): Promise<void> {
    if (content.trim() === "") return;

    const request: OpenAI.Responses.ResponseCreateParamsStreaming = {
      model: this.model,
      input: content,
      stream: true,
      previous_response_id: this.prevResponseId,
    };
    const index = this.exchanges.push({ query: content, reply: "" }) - 1;

    try {
      if (this.waiting) this.stop();

      this.waiting = true;
      this.abortController = new AbortController();

      const stream = await this.client.responses.create(
        request,
        { signal: this.abortController.signal },
      );

      for await (const event of stream) {
        switch (event.type) {
          case "response.output_text.delta":
            // TODO: maybe also assign response id here
            if (this.exchanges[index] !== undefined) {
              this.exchanges[index].reply += event.delta;
            }
            break;
          case "response.completed":
            this.prevResponseId = event.response.id;
            break;
        }
      }
    } catch {
      new Notice("Failed to get response");
    } finally {
      this.waiting = false;
      this.abortController = null;
    }
  }

  /** Stop receiving responses. **/
  stop(): void {
    this.abortController?.abort();
    this.waiting = false;
  }

  /** Clear current session's status. **/
  refresh(): void {
    this.stop();
    this.exchanges.length = 0;
    this.prevResponseId = null;
  }

  getExchanges(): Exchange[] {
    return this.exchanges;
  }

  isWaiting(): boolean {
    return this.waiting;
  }

  private makeClient(): OpenAI {
    const setting = this.plugin.setting;
    const secret = this.plugin.app.secretStorage;

    return new OpenAI({
      apiKey: secret.getSecret(setting.apiKey),
      baseURL: setting.baseURL,
      dangerouslyAllowBrowser: true,
    });
  }

  /** Read plugin setting and refresh client. */
  updateClient(): void {
    this.client = this.makeClient();
  }

  /** Read plugin setting and update model name. */
  updateModel(): void {
    this.model = this.plugin.setting.modelName;
  }
}

export { ChatService };
