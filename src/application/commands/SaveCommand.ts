import { EditorError } from "../../domain/EditorError.js";
import type { EditorSession } from "../EditorSession.js";
import type { SvgRepository } from "../ports/SvgRepository.js";
import type { IoCommand } from "./EditorCommand.js";

export class SaveCommand implements IoCommand {
  public readonly category = "io" as const;
  public readonly resetsHistory = false;

  public constructor(
    private readonly repository: SvgRepository,
    private readonly requestedPath?: string,
  ) {}

  public execute(session: EditorSession): readonly string[] {
    const document = session.requireDocument();
    const path = this.requestedPath ?? session.currentPath;
    if (path === undefined) {
      throw new EditorError("no file path. use 'save <file.svg>' first");
    }
    try {
      this.repository.write(path, document);
      session.currentPath = path;
      return [`saved to ${path} (${document.count()} elements)`];
    } catch {
      throw new EditorError(`cannot write file: ${path}`);
    }
  }
}
