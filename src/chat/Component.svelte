<script lang="ts">
import { Notice, setIcon } from "obsidian";

import InputBox from "./InputBox.svelte";
import Markdown from "./Markdown.svelte";

import type { ChatService } from "./service.svelte";
import type { ChatView } from "./view.svelte";

interface Props {
  view: ChatView;
  service: ChatService;
  active: () => number;
}

let { view, service, active }: Props = $props();

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
        <Markdown view={view} getContent={() => exchange.query} />
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
        <Markdown view={view} getContent={() => exchange.reply} />
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
  <InputBox service={service} active={active} />
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

.copy-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
}
</style>
