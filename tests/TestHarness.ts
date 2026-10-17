import { SvgEditor } from "../src/application/SvgEditor.js";
import { CommandFactory } from "../src/cli/CommandFactory.js";
import { SvgCliApplication } from "../src/cli/SvgCliApplication.js";
import { ShapeFactory } from "../src/domain/ShapeFactory.js";
import { FileSvgRepository } from "../src/infrastructure/FileSvgRepository.js";

export class TestHarness {
  private readonly application: SvgCliApplication;

  public constructor() {
    const shapeFactory = new ShapeFactory();
    const repository = new FileSvgRepository(shapeFactory);
    const editor = new SvgEditor();
    const commandFactory = new CommandFactory(
      shapeFactory,
      repository,
      editor.historyManager,
    );
    this.application = new SvgCliApplication(editor, commandFactory);
  }

  public run(line: string): readonly string[] {
    return this.application.executeLine(line);
  }
}
