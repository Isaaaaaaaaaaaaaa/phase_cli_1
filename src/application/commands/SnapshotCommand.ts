import type { SvgDocument } from "../../domain/SvgDocument.js";
import type { EditorSession } from "../EditorSession.js";
import type { ReversibleCommand } from "./EditorCommand.js";

export abstract class SnapshotCommand implements ReversibleCommand {
  public readonly category = "edit" as const;

  private before: SvgDocument | undefined;
  private after: SvgDocument | undefined;
  private forwardOutput: readonly string[] = [];

  public execute(session: EditorSession): readonly string[] {
    const document = session.requireDocument();
    this.before = document.clone();
    try {
      this.forwardOutput = this.perform(document);
      this.after = document.clone();
      return this.forwardOutput;
    } catch (error: unknown) {
      session.restoreDocument(this.before.clone());
      throw error;
    }
  }

  public undo(session: EditorSession): readonly string[] {
    if (this.before === undefined) {
      return [];
    }
    session.restoreDocument(this.before.clone());
    return this.undoOutput(session.requireDocument());
  }

  public redo(session: EditorSession): readonly string[] {
    if (this.after === undefined) {
      return [];
    }
    session.restoreDocument(this.after.clone());
    return this.forwardOutput;
  }

  protected abstract perform(document: SvgDocument): readonly string[];

  protected abstract undoOutput(document: SvgDocument): readonly string[];
}
