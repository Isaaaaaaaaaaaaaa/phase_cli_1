import type { Shape } from "../../domain/shapes/Shape.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class MoveCommand extends SnapshotCommand {
  private tagName = "shape";

  public constructor(
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    const shape = document.require(this.id);
    this.tagName = shape.tagName;
    shape.move(this.dx, this.dy);
    return [this.message(shape, false)];
  }

  protected override undoOutput(document: SvgDocument): readonly string[] {
    return [this.message(document.require(this.id), true)];
  }

  private message(shape: Shape, undo: boolean): string {
    const position = shape.positionSummary();
    if (position !== undefined) {
      return `${this.tagName}#${this.id} moved${undo ? " back" : ""} to ${position}`;
    }
    const dx = undo ? -this.dx : this.dx;
    const dy = undo ? -this.dy : this.dy;
    return `${this.tagName}#${this.id} moved${undo ? " back" : ""} by (${dx},${dy})`;
  }
}
