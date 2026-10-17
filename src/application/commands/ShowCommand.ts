import type { EditorSession } from "../EditorSession.js";
import type { ShapeRenderer } from "../presentation/ShapeRenderer.js";
import type { EditorCommand } from "./EditorCommand.js";

export class ShowCommand implements EditorCommand {
  public readonly category = "query" as const;

  public constructor(
    private readonly renderer: ShapeRenderer,
    private readonly id: string,
  ) {}

  public execute(session: EditorSession): readonly string[] {
    const document = session.requireDocument();
    const shape = document.require(this.id);
    return this.renderer.render(shape, document.parentLabel(this.id));
  }
}
