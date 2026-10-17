import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class GroupCommand extends SnapshotCommand {
  public constructor(
    private readonly id: string,
    private readonly childIds: readonly string[],
  ) {
    super();
  }

  protected override perform(document: SvgDocument): readonly string[] {
    const group = document.group(this.id, this.childIds);
    return [`g#${group.id} created with ${group.children.length} children`];
  }

  protected override undoOutput(): readonly string[] {
    return [`g#${this.id} grouping undone`];
  }
}
