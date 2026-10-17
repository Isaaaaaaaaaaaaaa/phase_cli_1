import type { ShapeFactory } from "../../domain/ShapeFactory.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class CreateCommand extends SnapshotCommand {
  public constructor(
    private readonly shapeFactory: ShapeFactory,
    private readonly type: string,
    private readonly id: string,
    private readonly args: readonly string[],
    private readonly parentId?: string,
  ) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    const shape = this.shapeFactory.create(this.type, this.id, this.args);
    document.add(shape, this.parentId);
    const parentMessage =
      this.parentId === undefined ? "" : ` in g#${this.parentId}`;
    return [`${shape.tagName}#${this.id} created${parentMessage}`];
  }

  protected override undoOutput(): readonly string[] {
    return [`${this.type}#${this.id} creation undone`];
  }
}
