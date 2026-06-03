<script lang="ts">
import type { ChatService } from "./service.svelte";

interface Props {
  service: ChatService;
  active: () => number;
}

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

<style>
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
