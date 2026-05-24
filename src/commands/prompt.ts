import * as z from "zod";

import { FuzzySuggestModal, Notice } from "obsidian";
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
  private editor: Editor;

  constructor(plugin: ChatSpace, editor: Editor, prompts: Prompts) {
    super(plugin.app);
    this.plugin = plugin;
    this.prompts = prompts;
    this.editor = editor;
  }

  override getItems(): Prompts {
    return this.prompts;
  }

  override getItemText(item: Prompt): string {
    return item.name;
  }

  override onChooseItem(item: Prompt): void {
    let selection = this.editor.getSelection();
    if (selection === "") {
      // Get all content if there is no selection
      selection = this.editor.getValue();
    }

    void toggleChat(this.plugin).then(
      () => {
        if (this.plugin.service === null) {
          new Notice("Error, chat service is not initialized");
          return;
        }
        const query = item.content + selection;
        void this.plugin.service.send(query);
      },
    );
  }
}

function makeModal(plugin: ChatSpace, editor: Editor): PromptSuggestion | null {
  try {
    const prompts = PromptsSchema.parse(JSON.parse(plugin.setting.prompts));
    return new PromptSuggestion(plugin, editor, prompts);
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
  const modal = makeModal(plugin, editor);
  if (modal === null) {
    return;
  }

  // Transfer control to suggestion modal
  modal.open();
}

export { applyPrompt };
