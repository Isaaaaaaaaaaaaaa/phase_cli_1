import { EditorError } from "../domain/EditorError.js";
import type { EditorSession } from "./EditorSession.js";
import type { ReversibleCommand } from "./commands/EditorCommand.js";

export class HistoryManager {
  private readonly undoStack: ReversibleCommand[] = [];
  private readonly redoStack: ReversibleCommand[] = [];
  private blocked = false;

  public execute(
    command: ReversibleCommand,
    session: EditorSession,
  ): readonly string[] {
    const output = command.execute(session);
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.blocked = false;
    return output;
  }

  public undo(session: EditorSession): readonly string[] {
    this.assertAllowed();
    const command = this.undoStack.pop();
    if (command === undefined) {
      throw new EditorError("nothing to undo");
    }
    const output = command.undo(session);
    this.redoStack.push(command);
    return output;
  }

  public redo(session: EditorSession): readonly string[] {
    this.assertAllowed();
    const command = this.redoStack.pop();
    if (command === undefined) {
      throw new EditorError("nothing to redo");
    }
    const output = command.redo(session);
    this.undoStack.push(command);
    return output;
  }

  public block(reset: boolean): void {
    this.blocked = true;
    this.redoStack.length = 0;
    if (reset) {
      this.undoStack.length = 0;
    }
  }

  private assertAllowed(): void {
    if (this.blocked) {
      throw new EditorError("undo not allowed after io command");
    }
  }
}
