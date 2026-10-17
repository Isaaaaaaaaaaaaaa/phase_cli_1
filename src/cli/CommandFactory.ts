import { AddToCommand } from "../application/commands/AddToCommand.js";
import { BackCommand } from "../application/commands/BackCommand.js";
import { CanvasCommand } from "../application/commands/CanvasCommand.js";
import { CreateCommand } from "../application/commands/CreateCommand.js";
import { DeleteCommand } from "../application/commands/DeleteCommand.js";
import type { EditorCommand } from "../application/commands/EditorCommand.js";
import { FrontCommand } from "../application/commands/FrontCommand.js";
import { GroupCommand } from "../application/commands/GroupCommand.js";
import { HelpCommand } from "../application/commands/HelpCommand.js";
import { InitCommand } from "../application/commands/InitCommand.js";
import { MoveCommand } from "../application/commands/MoveCommand.js";
import { ReadCommand } from "../application/commands/ReadCommand.js";
import { RedoCommand } from "../application/commands/RedoCommand.js";
import { SaveCommand } from "../application/commands/SaveCommand.js";
import { ScaleCommand } from "../application/commands/ScaleCommand.js";
import { SetCommand } from "../application/commands/SetCommand.js";
import { ShowCommand } from "../application/commands/ShowCommand.js";
import { TreeCommand } from "../application/commands/TreeCommand.js";
import { UndoCommand } from "../application/commands/UndoCommand.js";
import { UngroupCommand } from "../application/commands/UngroupCommand.js";
import type { HistoryManager } from "../application/HistoryManager.js";
import type { SvgRepository } from "../application/ports/SvgRepository.js";
import { ShapeRenderer } from "../application/presentation/ShapeRenderer.js";
import { TreeRenderer } from "../application/presentation/TreeRenderer.js";
import { EditorError } from "../domain/EditorError.js";
import type { ShapeFactory } from "../domain/ShapeFactory.js";
import {
  CommandTokenizer,
  type CommandToken,
} from "./CommandTokenizer.js";

type CommandBuilder = (tokens: readonly CommandToken[]) => EditorCommand;

export class CommandFactory {
  private readonly tokenizer = new CommandTokenizer();
  private readonly treeRenderer = new TreeRenderer();
  private readonly shapeRenderer = new ShapeRenderer();
  private readonly builders = new Map<string, CommandBuilder>([
    ["init", (tokens) => this.init(tokens)],
    ["read", (tokens) => this.read(tokens)],
    ["save", (tokens) => this.save(tokens)],
    ["canvas", (tokens) => this.canvas(tokens)],
    ["create", (tokens) => this.createShape(tokens)],
    ["delete", (tokens) => this.delete(tokens)],
    ["move", (tokens) => this.move(tokens)],
    ["scale", (tokens) => this.scale(tokens)],
    ["set", (tokens) => this.set(tokens)],
    ["group", (tokens) => this.group(tokens)],
    ["ungroup", (tokens) => this.ungroup(tokens)],
    ["addto", (tokens) => this.addTo(tokens)],
    ["front", (tokens) => this.front(tokens)],
    ["back", (tokens) => this.back(tokens)],
    ["tree", (tokens) => this.tree(tokens)],
    ["show", (tokens) => this.show(tokens)],
    ["help", (tokens) => this.help(tokens)],
    ["undo", (tokens) => this.undo(tokens)],
    ["redo", (tokens) => this.redo(tokens)],
  ]);

  public constructor(
    private readonly shapeFactory: ShapeFactory,
    private readonly repository: SvgRepository,
    private readonly history: HistoryManager,
  ) {}

  public fromLine(input: string): EditorCommand | undefined {
    const tokens = this.tokenizer.tokenize(input);
    const name = tokens[0]?.value;
    if (name === undefined) {
      return undefined;
    }
    const builder = this.builders.get(name);
    if (builder === undefined) {
      throw new EditorError(`unknown command: ${name}`);
    }
    return builder(tokens.slice(1));
  }

  private init(tokens: readonly CommandToken[]): EditorCommand {
    if (tokens.length === 0) {
      return new InitCommand(800, 600);
    }
    this.arity("init [w] [h]", tokens, 2, 2);
    return new InitCommand(
      this.number(tokens[0], "width"),
      this.number(tokens[1], "height"),
    );
  }

  private read(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("read <file.svg>", tokens, 1, 1);
    return new ReadCommand(this.repository, tokens[0]?.value ?? "");
  }

  private save(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("save [file.svg]", tokens, 0, 1);
    return new SaveCommand(this.repository, tokens[0]?.value);
  }

  private canvas(tokens: readonly CommandToken[]): EditorCommand {
    if (tokens.length === 0) {
      return new CanvasCommand();
    }
    this.arity("canvas [w] [h]", tokens, 2, 2);
    return new CanvasCommand(
      this.number(tokens[0], "width"),
      this.number(tokens[1], "height"),
    );
  }

  private createShape(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("create <type> <id> [params...] [in <containerId>]", tokens, 2);
    const type = tokens[0]?.value ?? "";
    const id = tokens[1]?.value ?? "";
    let argumentTokens = tokens.slice(2);
    let parentId: string | undefined;
    const inToken = argumentTokens.at(-2);
    if (inToken?.value === "in" && !inToken.quoted) {
      parentId = argumentTokens.at(-1)?.value;
      argumentTokens = argumentTokens.slice(0, -2);
    }
    if (
      type === "text" &&
      (argumentTokens.length < 3 || !argumentTokens[2]?.quoted)
    ) {
      throw new EditorError('usage: create text <id> <x> <y> "content"');
    }
    return new CreateCommand(
      this.shapeFactory,
      type,
      id,
      argumentTokens.map((token) => token.value),
      parentId,
    );
  }

  private delete(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("delete <id>", tokens, 1, 1);
    return new DeleteCommand(tokens[0]?.value ?? "");
  }

  private move(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("move <id> <dx> <dy>", tokens, 3, 3);
    return new MoveCommand(
      tokens[0]?.value ?? "",
      this.number(tokens[1], "dx"),
      this.number(tokens[2], "dy"),
    );
  }

  private scale(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("scale <id> <factor>", tokens, 2, 2);
    return new ScaleCommand(
      tokens[0]?.value ?? "",
      this.number(tokens[1], "factor"),
    );
  }

  private set(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("set <id> <attr> <value>", tokens, 3, 3);
    return new SetCommand(
      tokens[0]?.value ?? "",
      tokens[1]?.value ?? "",
      tokens[2]?.value ?? "",
    );
  }

  private group(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("group <newGid> <id1> <id2>...", tokens, 2);
    return new GroupCommand(
      tokens[0]?.value ?? "",
      tokens.slice(1).map((token) => token.value),
    );
  }

  private ungroup(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("ungroup <gid>", tokens, 1, 1);
    return new UngroupCommand(tokens[0]?.value ?? "");
  }

  private addTo(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("addto <gid> <id>", tokens, 2, 2);
    return new AddToCommand(
      tokens[0]?.value ?? "",
      tokens[1]?.value ?? "",
    );
  }

  private front(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("front <id>", tokens, 1, 1);
    return new FrontCommand(tokens[0]?.value ?? "");
  }

  private back(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("back <id>", tokens, 1, 1);
    return new BackCommand(tokens[0]?.value ?? "");
  }

  private tree(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("tree [id]", tokens, 0, 1);
    return new TreeCommand(this.treeRenderer, tokens[0]?.value);
  }

  private show(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("show <id>", tokens, 1, 1);
    return new ShowCommand(
      this.shapeRenderer,
      tokens[0]?.value ?? "",
    );
  }

  private help(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("help", tokens, 0, 0);
    return new HelpCommand();
  }

  private undo(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("undo", tokens, 0, 0);
    return new UndoCommand(this.history);
  }

  private redo(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("redo", tokens, 0, 0);
    return new RedoCommand(this.history);
  }

  private number(token: CommandToken | undefined, name: string): number {
    const value = Number(token?.value);
    if (token === undefined || !Number.isFinite(value)) {
      throw new EditorError(`invalid number for ${name}: ${token?.value ?? ""}`);
    }
    return value;
  }

  private arity(
    usage: string,
    tokens: readonly CommandToken[],
    minimum: number,
    maximum = Number.POSITIVE_INFINITY,
  ): void {
    if (tokens.length < minimum || tokens.length > maximum) {
      throw new EditorError(`usage: ${usage}`);
    }
  }
}
