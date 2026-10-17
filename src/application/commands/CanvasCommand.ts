import type { EditorSession } from "../EditorSession.js";
import type {
  CommandCategory,
  EditorCommand,
} from "./EditorCommand.js";

export class CanvasCommand implements EditorCommand {
  public readonly resetsHistory = true;

  public constructor(
    private readonly width?: number,
    private readonly height?: number,
  ) {}

  public get category(): CommandCategory {
    return this.width === undefined ? "query" : "io";
  }

  public execute(session: EditorSession): readonly string[] {
    const document = session.requireDocument();
    if (this.width === undefined || this.height === undefined) {
      return [`canvas ${document.width}x${document.height}`];
    }
    document.resize(this.width, this.height);
    return [`canvas resized to ${this.width}x${this.height}`];
  }
}
