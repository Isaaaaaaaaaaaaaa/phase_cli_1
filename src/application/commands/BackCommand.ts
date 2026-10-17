import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class BackCommand extends SnapshotCommand {
  private tagName = "shape";

  public constructor(private readonly id: string) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    this.tagName = document.require(this.id).tagName;
    document.sendToBack(this.id);
    return [`${this.tagName}#${this.id} sent to back`];
  }

  protected override undoOutput(): readonly string[] {
    return [`${this.tagName}#${this.id} z-order restored`];
  }
}
