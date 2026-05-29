<script lang="ts">
import { marked } from "marked";
import { Notice, setIcon } from "obsidian";

import DOMPurify from "dompurify";

import type { Props } from "./view.svelte";

let { service, active }: Props = $props();
let textArea!: HTMLTextAreaElement;

$effect(() => {
  if (active() === 0) return;

  let reqId1: number;
  let reqId2: number;

  reqId1 = requestAnimationFrame(() => {
    reqId2 = requestAnimationFrame(() => {
      textArea.focus();
    });
  });

  return () => {
    cancelAnimationFrame(reqId1);
    cancelAnimationFrame(reqId2);
  };
});

function send(): void {
  void service.send(textArea.value);
  textArea.value = "";
}

function copy(content: string): void {
  navigator.clipboard.writeText(content)
    .then(() => new Notice("Copied message"))
    .catch(() => new Notice("Failed to copy message"));
}
</script>

<div class="component">
  <div class="qrbox-list">
    {#each service.getExchanges() as exchange}
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
      onkeydown={(event: KeyboardEvent) => {
        if (service.isWaiting()) return;
        if (event.key !== "Enter" || event.shiftKey) return;

        event.preventDefault();
        send();
      }}
      {@attach (node: HTMLTextAreaElement) => {
        node.focus();
      }}
    ></textarea>
    <button
      class="newchat-button"
      onclick={() => {
        service.refresh();
      }}
    >
      New Chat
    </button>
    {#if service.isWaiting()}
      <button
        class="stop-button"
        onclick={() => {
          service.stop();
        }}
      >
        Stop
      </button>
    {:else}
      <button
        class="send-button"
        onclick={() => {
          if (textArea.value.trim() === "") return;
          send();
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
  flex: 3;

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
