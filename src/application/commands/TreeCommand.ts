import type { EditorSession } from "../EditorSession.js";
import type { TreeRenderer } from "../presentation/TreeRenderer.js";
import type { EditorCommand } from "./EditorCommand.js";

export class TreeCommand implements EditorCommand {
  public readonly category = "query" as const;

  public constructor(
    private readonly renderer: TreeRenderer,
    private readonly rootId?: string,
  ) {}

  public execute(session: EditorSession): readonly string[] {
    return this.renderer.render(session.requireDocument(), this.rootId);
  }
}
