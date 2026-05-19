<script lang="ts">
import { onMount } from "svelte";

let messages: string[] = $state([]);

/// Functions for textarea

let inputMessage = $state("");

/** Update message box list with input message. */
function sendMessage(): void {
  if (inputMessage.trim() != "") {
    messages.push(inputMessage);
    inputMessage = "";
  }
}

/** Send message on enter key down. */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key == "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

/// Functions for message box

let copiedMessageIdx: number | undefined = $state(undefined);

/** Copy message indexed by `messageIdx` to clipboard.
 *
 * Update `copiedMessageIdx` to `messageIdx` if successful.
 */
async function copyToClipboard(messageIdx: number): Promise<void> {
  try {
    const msg = messages[messageIdx];

    if (msg != undefined) {
      await navigator.clipboard.writeText(msg);

      copiedMessageIdx = messageIdx;
      setTimeout(() => {
        copiedMessageIdx = undefined;
      }, 2000);
    } else {
      console.warn(`Index ${messageIdx} is out of bound.`);
    }
  } catch (err) {
    console.error("Failed to copy message:", err);
  }
}

/// Register events
let textareaElement: HTMLTextAreaElement | undefined = $state(undefined);

// Focus on load
onMount(() => {
  if (textareaElement != undefined) {
    textareaElement.focus();
  }
});
</script>

<div class="chat-component">
  <div class="message-box-list">
    {#each messages as msg, idx}
      <div class="message-box">
        <p class="message">{msg}</p>
        <button
          class="copy-button"
          onclick={() => copyToClipboard(idx)}
        >
          {copiedMessageIdx == idx ? "Copied" : "Copy"}
        </button>
      </div>
    {/each}
  </div>

  <div class="input-box">
    <textarea
      class="input-textarea"
      placeholder="Enter your prompt here..."
      bind:this={textareaElement}
      bind:value={inputMessage}
      onkeydown={handleKeydown}
    ></textarea>
    <button class="send-button" onclick={() => sendMessage}>
      Send
    </button>
  </div>
</div>

<style>
.chat-component {
  /* Properties for serving as a container element */ 
  display: flex;
  flex-direction: column;

  /* Properties for serving as a contained element */
  height: 100%;
  width: 100%;

  font-size: var(--font-text-size);
  font-family: var(--font-interface);
  background-color: var(--background-primary);
}

.message-box-list {
  /* Properties for serving as a container element */ 
  display: flex;
  flex-direction: column;
  overflow: auto;

  /* Properties for serving as a contained element */
  flex: 8.5; 
}

.message-box {
  /* Properties for serving as a container element */ 
  position: relative;
  border-radius: 4px;
  border: 0.5px solid var(--background-secondary);

  padding: 4px;
  background-color: var(--background-secondary);

  /* Properties for serving as a contained element */
  margin: 4px;
}

.message {
  margin: 1.5px;
  height: 100%;
  width: 100%;

  white-space: pre-wrap;
}

.copy-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.copy-button:hover {
  background-color: var(--interactive-hover);
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

.send-button:hover {
  background-color: var(--interactive-hover);
}
</style>
