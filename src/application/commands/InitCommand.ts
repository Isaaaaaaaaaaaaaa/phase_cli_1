import { SvgDocument } from "../../domain/SvgDocument.js";
import type { EditorSession } from "../EditorSession.js";
import type { IoCommand } from "./EditorCommand.js";

export class InitCommand implements IoCommand {
  public readonly category = "io" as const;
  public readonly resetsHistory = true;

  public constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}

  public execute(session: EditorSession): readonly string[] {
    session.replaceDocument(new SvgDocument(this.width, this.height));
    return [`canvas ${this.width}x${this.height} created`];
  }
}
