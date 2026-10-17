import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class AddToCommand extends SnapshotCommand {
  private tagName = "shape";
  private previousParent = "svg";

  public constructor(
    private readonly groupId: string,
    private readonly shapeId: string,
  ) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    const shape = document.require(this.shapeId);
    this.tagName = shape.tagName;
    this.previousParent = document.parentLabel(this.shapeId);
    document.moveInto(this.groupId, this.shapeId);
    return [`${this.tagName}#${this.shapeId} moved into g#${this.groupId}`];
  }

  protected override undoOutput(): readonly string[] {
    return [
      `${this.tagName}#${this.shapeId} restored into ${this.previousParent}`,
    ];
  }
}
