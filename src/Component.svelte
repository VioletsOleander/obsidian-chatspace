<script lang="ts">
import { Notice, type SecretStorage } from "obsidian";
import Client from "openai";
import { onMount } from "svelte";
import type { Setting } from "./setting";

type Request = Client.Responses.ResponseCreateParamsStreaming;

interface Props {
  setting: Setting;
  secretStorage: SecretStorage;
}

let { setting, secretStorage }: Props = $props();
let client = $derived.by(() => {
  return new Client({
    apiKey: secretStorage.getSecret(setting.apiKey),
    baseURL: setting.baseURL,
    dangerouslyAllowBrowser: true,
  });
});
let prevResponseId: string | undefined;

let messages: string[] = $state([]);
let userQuery = $state("");
let textArea: HTMLTextAreaElement | undefined = $state();

async function sendMessage(): Promise<void> {
  if (userQuery.trim() === "") {
    new Notice("Can not send empty message");
    return;
  }

  const responseIdx = messages.push(userQuery);

  let request: Request = {
    model: setting.modelName,
    input: userQuery,
    stream: true,
  };
  if (prevResponseId != undefined) {
    request["previous_response_id"] = prevResponseId;
  }

  userQuery = "";

  const stream = await client.responses.create(request);
  try {
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        if (messages[responseIdx] === undefined) {
          messages.push(event.delta);
        } else {
          messages[responseIdx] += event.delta;
        }
      } else if (event.type === "response.completed") {
        prevResponseId = event.response.id;
      }
    }
  } catch (err) {
    new Notice("Failed to get response");
  }
}

/** Copy `text` to clipboard. */
async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    new Notice("Copied message");
  } catch (err) {
    new Notice("Failed to copy message");
  }
}

// Focus on load
onMount(() => {
  if (textArea != undefined) {
    textArea.focus();
  }
});
</script>

<div class="chat-component">
  <div class="message-box-list">
    {#each messages as msg}
      <div class="message-box">
        <p class="message">{msg}</p>
        <button
          class="copy-button"
          onclick={() => copyText(msg)}
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
      bind:value={userQuery}
      onkeydown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      }}
    ></textarea>
    <button class="send-button" onclick={sendMessage}>
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
