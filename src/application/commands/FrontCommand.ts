import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class FrontCommand extends SnapshotCommand {
  private tagName = "shape";

  public constructor(private readonly id: string) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    this.tagName = document.require(this.id).tagName;
    document.bringToFront(this.id);
    return [`${this.tagName}#${this.id} brought to front`];
  }

  protected override undoOutput(): readonly string[] {
    return [`${this.tagName}#${this.id} z-order restored`];
  }
}
