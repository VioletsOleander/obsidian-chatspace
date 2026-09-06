import { Notice, SecretStorage } from "obsidian";

import OpenAI from "openai";

interface Exchange {
  query: string;
  reply: string;
}

interface Config {
  apiKey: string;
  baseURL: string;
  modelName: string;
}

class ChatService {
  private config: Config;
  private secret: SecretStorage;
  private client!: OpenAI;

  private exchanges: Exchange[];
  private waiting: boolean;
  private prevResponseId: string | null;

  private abortController: AbortController | null;

  constructor(config: Config, secret: SecretStorage) {
    this.config = config;
    this.secret = secret;
    this.updateClient();

    this.exchanges = $state([]);
    this.waiting = $state(false);
    this.prevResponseId = null;

    this.abortController = null;
  }

  /** Send content and asynchronously wait for response. **/
  async send(content: string): Promise<void> {
    if (content.trim() === "") return;

    const request: OpenAI.Responses.ResponseCreateParamsStreaming = {
      model: this.config.modelName,
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

  updateAPI(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.updateClient();
  }

  updateURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.updateClient();
  }

  updateModel(modelName: string): void {
    this.config.modelName = modelName;
  }

  private updateClient(): void {
    this.client = new OpenAI({
      apiKey: this.secret.getSecret(this.config.apiKey),
      baseURL: this.config.baseURL,
      dangerouslyAllowBrowser: true,
    });
  }
}

export { ChatService };
