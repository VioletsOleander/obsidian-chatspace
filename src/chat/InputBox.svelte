<script lang="ts">
import { setIcon } from "obsidian";

import type { ChatService } from "./service.svelte";

interface Props {
  service: ChatService;
}

let { service }: Props = $props();
let textArea!: HTMLTextAreaElement;

function send(): void {
  void service.send(textArea.value);
  textArea.value = "";
}

export function focus(): void {
  textArea.focus();
}
</script>

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
    aria-label="New Chat"
    onclick={() => {
      service.refresh();
    }}
  >
    <span
      class="newchat-icon"
      {@attach (node: HTMLSpanElement) => {
        setIcon(node, "message-circle-plus");
      }}
    ></span>
  </button>
  {#if service.isWaiting()}
    <button
      class="stop-button"
      aria-label="Stop"
      onclick={() => {
        service.stop();
      }}
    >
      <span
        class="stop-icon"
        {@attach (node: HTMLSpanElement) => {
          setIcon(node, "square");
        }}
      ></span>
    </button>
  {:else}
    <button
      class="send-button"
      aria-label="Send"
      onclick={() => {
        if (textArea.value.trim() === "") return;
        send();
      }}
    >
      <span
        class="send-icon"
        {@attach (node: HTMLSpanElement) => {
          setIcon(node, "send");
        }}
      ></span>
    </button>
  {/if}
</div>

<style>
.newchat-button {
  position: absolute;
  top: 3px;
  right: 3px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: none;
  background: none;
}

.newchat-button:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.newchat-icon {
  --icon-size: 16px;
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
  bottom: 3px;
  right: 3px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: none;
  background: none;
}

.send-button:hover, .stop-button:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.send-icon, .stop-icon {
  --icon-size: 16px;
}
</style>
