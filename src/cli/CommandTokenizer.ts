import { EditorError } from "../domain/EditorError.js";

export interface CommandToken {
  readonly value: string;
  readonly quoted: boolean;
}

export class CommandTokenizer {
  public tokenize(input: string): readonly CommandToken[] {
    const trimmed = input.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      return [];
    }

    const tokens: CommandToken[] = [];
    let value = "";
    let quoted = false;
    let wasQuoted = false;
    let tokenStarted = false;
    let escaping = false;

    for (const character of input) {
      if (escaping) {
        value += character;
        escaping = false;
        tokenStarted = true;
        continue;
      }
      if (quoted && character === "\\") {
        escaping = true;
        continue;
      }
      if (character === '"') {
        quoted = !quoted;
        wasQuoted = true;
        tokenStarted = true;
        continue;
      }
      if (!quoted && /\s/u.test(character)) {
        if (tokenStarted) {
          tokens.push({ value, quoted: wasQuoted });
          value = "";
          tokenStarted = false;
          wasQuoted = false;
        }
        continue;
      }
      value += character;
      tokenStarted = true;
    }

    if (quoted || escaping) {
      throw new EditorError("unterminated quoted argument");
    }
    if (tokenStarted) {
      tokens.push({ value, quoted: wasQuoted });
    }
    return tokens;
  }
}
