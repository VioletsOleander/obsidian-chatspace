<script lang="ts">
import { Notice, type SecretStorage, setIcon } from "obsidian";
import Client from "openai";
import { onMount } from "svelte";
import type { Setting } from "./setting";

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

interface Message {
  role: "user" | "assistant";
  content: string;
}

let messages: Message[] = $state([]);
let inputContent = $state("");
let prevResponseId: string | undefined;

type Request = Client.Responses.ResponseCreateParamsStreaming;

async function send(): Promise<void> {
  if (inputContent.trim() === "") {
    new Notice("Can not send empty content");
    return;
  }

  const message: Message = { role: "user", content: inputContent };
  const responseIdx = messages.push(message);

  let request: Request = {
    model: setting.modelName,
    input: inputContent,
    stream: true,
  };
  if (prevResponseId != undefined) {
    request["previous_response_id"] = prevResponseId;
  }

  inputContent = "";

  const stream = await client.responses.create(request);
  try {
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        if (messages[responseIdx] === undefined) {
          messages.push({ role: "assistant", content: event.delta });
        } else {
          messages[responseIdx].content += event.delta;
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
let textArea: HTMLTextAreaElement | undefined = $state();
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
        <span
          class="message-icon"
          {@attach (node: HTMLElement) => {
            if (msg.role === "user") {
              setIcon(node, "user-round");
            } else {
              setIcon(node, "bot");
            }
          }}
        ></span>
        <p class="message-content">{msg.content}</p>
        <button
          class="copy-button"
          onclick={() => copyText(msg.content)}
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
      bind:value={inputContent}
      onkeydown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          send();
        }
      }}
    ></textarea>
    <button
      class="newchat-button"
      onclick={() => {
        prevResponseId = undefined;
        messages.length = 0;
      }}
    >
      New Chat
    </button>
    <button class="send-button" onclick={send}>
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
  font-family: var(--font-text-theme);
  background-color: var(--background-primary);
}

.message-box-list {
  /* Properties for serving as a container element */ 
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: auto;

  /* Properties for serving as a contained element */
  flex: 8.5; 
}

.message-box {
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

.message-icon {
  flex: 2;

  --icon-size: 24px;
}

.message-content {
  flex: 70;
  margin: 1.5px;
  white-space: pre-wrap;

  user-select: text;
}

.newchat-button {
  position: absolute;
  top: 10px;
  right: 10px;
}

.copy-button {
  position: absolute;
  bottom: 10px;
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
