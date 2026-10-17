import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class DeleteCommand extends SnapshotCommand {
  private tagName = "shape";
  private parent = "svg";

  public constructor(private readonly id: string) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    const shape = document.require(this.id);
    this.tagName = shape.tagName;
    this.parent = document.parentLabel(this.id);
    document.remove(this.id);
    return [`${this.tagName}#${this.id} deleted`];
  }

  protected override undoOutput(): readonly string[] {
    return [`${this.tagName}#${this.id} restored into ${this.parent}`];
  }
}
