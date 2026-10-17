import { EditorError } from "../domain/EditorError.js";
import type { SvgDocument } from "../domain/SvgDocument.js";

export class EditorSession {
  private document: SvgDocument | undefined;
  private sourcePath: string | undefined;

  public requireDocument(): SvgDocument {
    if (this.document === undefined) {
      throw new EditorError("no document. use 'init' or 'read' first");
    }
    return this.document;
  }

  public replaceDocument(document: SvgDocument, sourcePath?: string): void {
    this.document = document;
    this.sourcePath = sourcePath;
  }

  public restoreDocument(document: SvgDocument): void {
    this.document = document;
  }

  public get currentPath(): string | undefined {
    return this.sourcePath;
  }

  public set currentPath(path: string | undefined) {
    this.sourcePath = path;
  }
}
