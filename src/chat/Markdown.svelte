<script lang="ts">
import { MarkdownRenderer, Notice } from "obsidian";

import type { ChatView } from "./view.svelte";

interface Props {
  view: ChatView;
  getContent: () => string;
}

let { view, getContent }: Props = $props();
</script>

<div
  class="markdown"
  {@attach (node: HTMLDivElement) => {
    MarkdownRenderer.render(view.app, getContent(), node, "", view)
      .catch(() => {
        new Notice("Failed to render markdown");
      });

    return () => {
      // Teardown: clear current content before re-populating
      node.replaceChildren();
    };
  }}
>
</div>

<style>
.markdown {
  flex: 70;
  margin: 1.5px;

  user-select: text;
}
</style>
