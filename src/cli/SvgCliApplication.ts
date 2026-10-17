import { createInterface } from "node:readline";
import type { SvgEditor } from "../application/SvgEditor.js";
import { EditorError } from "../domain/EditorError.js";
import type { CommandFactory } from "./CommandFactory.js";

export class SvgCliApplication {
  public constructor(
    private readonly editor: SvgEditor,
    private readonly commandFactory: CommandFactory,
  ) {}

  public executeLine(input: string): readonly string[] {
    try {
      const command = this.commandFactory.fromLine(input);
      return command === undefined ? [] : this.editor.execute(command);
    } catch (error: unknown) {
      const message =
        error instanceof EditorError
          ? error.message
          : "unexpected internal failure";
      return [`error: ${message}`];
    }
  }

  public run(): void {
    const lines = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY,
    });
    console.log("svg-editor 0.1 - type 'help' for commands");
    lines.setPrompt("svg> ");
    lines.prompt();
    lines.on("line", (line) => {
      for (const output of this.executeLine(line)) {
        console.log(output);
      }
      lines.prompt();
    });
  }
}
