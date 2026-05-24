<script lang="ts">
import DOMPurify from "dompurify";
import { marked } from "marked";
import { Notice, setIcon } from "obsidian";
import OpenAI from "openai";
import { untrack } from "svelte";
import { pool } from "./storage.svelte";

import type { Props } from "./chat";

interface Exchange {
  query: string;
  reply: string;
}

const { setting, secret }: Props = $props();
const client = $derived.by(() => {
  return new OpenAI({
    apiKey: secret.getSecret(setting.apiKey),
    baseURL: setting.baseURL,
    dangerouslyAllowBrowser: true,
  });
});
const exchanges: Exchange[] = $state([]);

let textArea!: HTMLTextAreaElement;
let prevResponseId: string | null = null;
let controller: AbortController | null = null;
let waiting = $state(false);

$effect(
  () => {
    const query = pool.query;
    untrack(() => {
      // TODO: set query = "" will actually trigger this effect again
      // this conditional serves as the escape path for the second trigger
      // more elegant method is required
      if (query.trim() === "") {
        return;
      }

      void send(query);
      pool.query = "";
    });
  },
);

async function send(content: string): Promise<void> {
  const request: OpenAI.Responses.ResponseCreateParamsStreaming = {
    model: setting.modelName,
    input: content,
    stream: true,
    previous_response_id: prevResponseId,
  };
  const index = exchanges.push({ query: content, reply: "" }) - 1;

  try {
    waiting = true;
    controller = new AbortController();

    const stream = await client.responses.create(request, {
      signal: controller.signal,
    });

    for await (const event of stream) {
      switch (event.type) {
        case "response.output_text.delta":
          if (exchanges[index] !== undefined) {
            exchanges[index].reply += event.delta;
          }
          break;
        case "response.completed":
          prevResponseId = event.response.id;
          break;
      }
    }
  } catch {
    new Notice("Failed to get response");
  } finally {
    waiting = false;
    controller = null;
  }
}

function stop(): void {
  controller?.abort();
  waiting = false;
}

function copy(content: string): void {
  navigator.clipboard.writeText(content)
    .then(() => new Notice("Copied message"))
    .catch(() => new Notice("Failed to copy message"));
}

function refresh(): void {
  stop();
  exchanges.length = 0;
  prevResponseId = null;
}

function onKeyDown(event: KeyboardEvent): void {
  if (waiting) {
    return;
  }
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }
  event.preventDefault();

  pool.query = textArea.value;
  textArea.value = "";
}
</script>

<div class="component">
  <div class="qrbox-list">
    {#each exchanges as exchange}
      <div class="query-box">
        <span
          class="query-icon"
          {@attach (node: HTMLSpanElement) => {
            setIcon(node, "user-round");
          }}
        ></span>
        <p class="query-content">{exchange.query}</p>
        <button
          class="copy-button"
          onclick={() => {
            copy(exchange.query);
          }}
        >
          Copy
        </button>
      </div>
      <div class="reply-box">
        <span
          class="reply-icon"
          {@attach (node: HTMLSpanElement) => {
            setIcon(node, "bot");
          }}
        ></span>
        <div class="reply-content">
          {@html DOMPurify.sanitize(marked.parse(exchange.reply, { async: false }))}
        </div>
        <button
          class="copy-button"
          onclick={() => {
            copy(exchange.reply);
          }}
        >
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
      {@attach (node: HTMLTextAreaElement) => {
        node.focus();
      }}
    ></textarea>
    <button class="newchat-button" onclick={refresh}>
      New Chat
    </button>
    {#if waiting}
      <button class="stop-button" onclick={stop}>
        Stop
      </button>
    {/if}
    {#if !waiting}
      <button
        class="send-button"
        onclick={() => {
          pool.query = textArea.value;
          textArea.value = "";
        }}
      >
        Send
      </button>
    {/if}
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
  font-family: var(--font-interface-theme), var(--font-text-theme), var(--font-monospace-theme);
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
  border: 1px solid var(--background-primary-alt);

  padding: 16px;
  background-color: var(--background-primary-alt);

  /* Properties for serving as a contained element */
  margin: 4px;
}

.query-icon, .reply-icon {
  flex: 2;

  --icon-size: 24px;
}

.query-content {
  flex: 70;
  margin: 1.5px;
  white-space: pre-wrap;

  user-select: text;
}

.reply-content {
  flex: 70;
  margin: 1.5px;

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

.send-button, .stop-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
}
</style>
