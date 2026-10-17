import type { EditorSession } from "../EditorSession.js";
import type { HistoryManager } from "../HistoryManager.js";
import type { EditorCommand } from "./EditorCommand.js";

export class RedoCommand implements EditorCommand {
  public readonly category = "history" as const;

  public constructor(private readonly history: HistoryManager) {}

  public execute(session: EditorSession): readonly string[] {
    session.requireDocument();
    return this.history.redo(session);
  }
}
