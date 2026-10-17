import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class UngroupCommand extends SnapshotCommand {
  private childCount = 0;

  public constructor(private readonly id: string) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    this.childCount = document.ungroup(this.id);
    return [`g#${this.id} ungrouped (${this.childCount} children promoted)`];
  }

  protected override undoOutput(): readonly string[] {
    return [`g#${this.id} restored`];
  }
}
