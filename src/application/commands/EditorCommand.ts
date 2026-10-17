import type { EditorSession } from "../EditorSession.js";

export type CommandCategory = "edit" | "io" | "query" | "history";

export interface EditorCommand {
  readonly category: CommandCategory;
  execute(session: EditorSession): readonly string[];
}

export interface IoCommand extends EditorCommand {
  readonly category: "io";
  readonly resetsHistory: boolean;
}

export interface ReversibleCommand extends EditorCommand {
  readonly category: "edit";
  undo(session: EditorSession): readonly string[];
  redo(session: EditorSession): readonly string[];
}
