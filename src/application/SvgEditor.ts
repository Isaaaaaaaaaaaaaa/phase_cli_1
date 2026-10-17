import type {
  EditorCommand,
  IoCommand,
  ReversibleCommand,
} from "./commands/EditorCommand.js";
import { EditorSession } from "./EditorSession.js";
import { HistoryManager } from "./HistoryManager.js";

export class SvgEditor {
  public constructor(
    private readonly session = new EditorSession(),
    private readonly history = new HistoryManager(),
  ) {}

  public execute(command: EditorCommand): readonly string[] {
    if (command.category === "edit") {
      return this.history.execute(command as ReversibleCommand, this.session);
    }
    const output = command.execute(this.session);
    if (command.category === "io") {
      this.history.block((command as IoCommand).resetsHistory);
    }
    return output;
  }

  public get historyManager(): HistoryManager {
    return this.history;
  }
}
