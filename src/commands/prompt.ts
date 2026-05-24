import { pool } from "@/view/storage.svelte";
import { FuzzySuggestModal, Notice } from "obsidian";
import { z } from "zod";
import { toggleChat } from "./toggle";

import type { ChatSpace } from "@/main";
import type { Editor } from "obsidian";

const PromptSchema: z.ZodObject<{
  name: z.ZodString;
  content: z.ZodString;
}> = z.object({ name: z.string(), content: z.string() });

const PromptsSchema: z.ZodArray<
  z.ZodObject<{
    name: z.ZodString;
    content: z.ZodString;
  }>
> = z.array(PromptSchema).min(1);

type Prompt = z.infer<typeof PromptSchema>;
type Prompts = z.infer<typeof PromptsSchema>;

class PromptSuggestion extends FuzzySuggestModal<Prompt> {
  private prompts: Prompts;
  private plugin: ChatSpace;
  editor: Editor | undefined;

  constructor(plugin: ChatSpace, prompts: Prompts) {
    super(plugin.app);
    this.plugin = plugin;
    this.prompts = prompts;
  }

  override getItems(): Prompts {
    return this.prompts;
  }

  override getItemText(item: Prompt): string {
    return item.name;
  }

  override onChooseItem(item: Prompt): void {
    if (this.editor === undefined) {
      new Notice("Error: cannot find editor");
      return;
    }

    let selection = this.editor.getSelection();
    if (selection === "") {
      // Get all content if there is no selection
      selection = this.editor.getValue();
    }

    void toggleChat(this.plugin).then(
      () => {
        const query = item.content + " " + selection;
        pool.query = query;
      },
    );
  }
}

function makeModal(plugin: ChatSpace): PromptSuggestion | null {
  try {
    const prompts = PromptsSchema.parse(JSON.parse(plugin.setting.prompts));
    return new PromptSuggestion(plugin, prompts);
  } catch (err) {
    if (err instanceof z.ZodError) {
      new Notice("Failed to parse prompts:\n" + z.prettifyError(err));
    } else {
      new Notice("Failed to parse prompts, not valid JSON");
    }
    return null;
  }
}

/** Open prompt selection modal and apply prompt to selection content on user choosing item. */
function applyPrompt(plugin: ChatSpace, editor: Editor): void {
  // Initialize suggestion modal
  const modal = makeModal(plugin);
  if (modal === null) {
    return;
  }

  // Transfer control to suggestion modal
  modal.editor = editor;
  modal.open();
}

export { applyPrompt };
export type { Prompt, Prompts, PromptSuggestion };
