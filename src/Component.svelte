<script lang="ts">
import { Notice, setIcon } from "obsidian";
import OpenAI from "openai";

import type { SecretStorage } from "obsidian";
import type { Setting } from "./setting";

interface Props {
  setting: Setting;
  secretStorage: SecretStorage;
}

interface Exchange {
  query: string;
  reply: string;
}

let textArea!: HTMLTextAreaElement;

let { setting, secretStorage }: Props = $props();

let currentChatId: number = 0;
let prevResponseId: string | null = null;
let exchanges: Exchange[] = $state([]);

let client = $derived.by(() => {
  return new OpenAI({
    apiKey: secretStorage.getSecret(setting.apiKey),
    baseURL: setting.baseURL,
    dangerouslyAllowBrowser: true,
  });
});

async function send(): Promise<void> {
  if (textArea.value.trim() === "") {
    new Notice("Cannot send empty content");
    return;
  }

  const chatId = currentChatId;

  const request: OpenAI.Responses.ResponseCreateParamsStreaming = {
    model: setting.modelName,
    input: textArea.value,
    stream: true,
    previous_response_id: prevResponseId,
  };
  exchanges.push({ query: textArea.value, reply: "" });
  textArea.value = "";

  const stream = await client.responses.create(request);

  try {
    for await (const event of stream) {
      if (chatId !== currentChatId) {
        break;
      }

      switch (event.type) {
        case "response.output_text.delta":
          exchanges.at(-1)!.reply += event.delta;
          break;
        case "response.completed":
          prevResponseId = event.response.id;
          break;
      }
    }
  } catch (err) {
    new Notice("Failed to get response");
  }
}

function copy(content: string): void {
  navigator.clipboard.writeText(content)
    .then(() => new Notice("Copied message"))
    .catch(() => new Notice("Failed to copy message"));
}

function refresh(): void {
  currentChatId += 1;
  exchanges.length = 0;
  prevResponseId = null;
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    send();
  }
}
</script>

<div class="component">
  <div class="qrbox-list">
    {#each exchanges as exchange}
      <div class="query-box">
        <span
          class="query-icon"
          {@attach (node: HTMLSpanElement) => setIcon(node, "user-round")}
        ></span>
        <p class="query-content">{exchange.query}</p>
        <button class="copy-button" onclick={() => copy(exchange.query)}>
          Copy
        </button>
      </div>
      <div class="reply-box">
        <span
          class="reply-icon"
          {@attach (node: HTMLSpanElement) => setIcon(node, "bot")}
        ></span>
        <p class="reply-content">{exchange.reply}</p>
        <button class="copy-button" onclick={() => copy(exchange.reply)}>
          Copy
        </button>
      </div>
    {/each}
  </div>

  <div class="input-box">
    <textarea
      class="input-textarea"
      placeholder="Enter your prompt here..."
      bind:this={textArea}
      onkeydown={onKeyDown}
      {@attach (node: HTMLTextAreaElement) => node.focus()}
    ></textarea>
    <button class="newchat-button" onclick={refresh}>
      New Chat
    </button>
    <button class="send-button" onclick={send}>
      Send
    </button>
  </div>
</div>

<style>
.component {
  /* Properties for serving as a container element */ 
  display: flex;
  flex-direction: column;

  /* Properties for serving as a contained element */
  height: 100%;
  width: 100%;

  font-size: var(--font-text-size);
  font-family: var(--font-text-theme);
  background-color: var(--background-primary);
}

.qrbox-list {
  /* Properties for serving as a container element */ 
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: auto;

  /* Properties for serving as a contained element */
  flex: 8.5; 
}

.query-box, .reply-box {
  /* Properties for serving as a container element */ 
  display: inline-flex;
  flex-direction: row;

  position: relative;
  border-radius: 4px;
  border: 1px solid var(--background-secondary);

  padding: 16px;
  background-color: var(--background-secondary);

  /* Properties for serving as a contained element */
  margin: 4px;
}

.query-icon, .reply-icon {
  flex: 2;

  --icon-size: 24px;
}

.query-content, .reply-content {
  flex: 70;
  margin: 1.5px;
  white-space: pre-wrap;

  user-select: text;
}

.copy-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.newchat-button {
  position: absolute;
  top: 10px;
  right: 10px;
}

.input-box {
  /* Properties for serving as a container element */ 
  position: relative;

  /* Properties for serving as a contained element */
  flex: 1.5;
  height: 100%; 
  width: 100%;
}

.input-textarea {
  /* Properties for serving as a container element */ 
  overflow: auto;

  /* Properties for serving as a contained element */
  height: 100%;
  width: 100%;
  resize: none;

  font-size: inherit;
  font-family: inherit;

}

.send-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
}
</style>
