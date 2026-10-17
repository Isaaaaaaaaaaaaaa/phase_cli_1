import { EditorError } from "../../domain/EditorError.js";
import type { EditorSession } from "../EditorSession.js";
import type { SvgRepository } from "../ports/SvgRepository.js";
import type { IoCommand } from "./EditorCommand.js";

export class ReadCommand implements IoCommand {
  public readonly category = "io" as const;
  public readonly resetsHistory = true;

  public constructor(
    private readonly repository: SvgRepository,
    private readonly path: string,
  ) {}

  public execute(session: EditorSession): readonly string[] {
    try {
      const result = this.repository.read(this.path);
      session.replaceDocument(result.document, this.path);
      return [
        ...result.warnings,
        `read ${this.path} (${result.document.count()} elements)`,
      ];
    } catch (error: unknown) {
      if (error instanceof EditorError) {
        throw error;
      }
      throw new EditorError(`cannot read file: ${this.path}`);
    }
  }
}
