import type { SvgDocument } from "../../domain/SvgDocument.js";

export interface ReadResult {
  readonly document: SvgDocument;
  readonly warnings: readonly string[];
}

export interface SvgRepository {
  read(path: string): ReadResult;
  write(path: string, document: SvgDocument): void;
}
