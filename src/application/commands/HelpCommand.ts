import type { EditorCommand } from "./EditorCommand.js";

export class HelpCommand implements EditorCommand {
  public readonly category = "query" as const;

  public execute(): readonly string[] {
    return [
      "Document:",
      "  init [w] [h]",
      "  read <file.svg>",
      "  save [file.svg]",
      "  canvas [w] [h]",
      "Edit:",
      "  create <type> <id> [params...] [in <containerId>]",
      "  delete <id>",
      "  move <id> <dx> <dy>",
      "  scale <id> <factor>",
      "  set <id> <attr> <value>",
      "  group <newGid> <id1> <id2>...",
      "  ungroup <gid>",
      "  addto <gid> <id>",
      "  front <id>",
      "  back <id>",
      "Display:",
      "  tree [id]",
      "  show <id>",
      "  help",
      "History:",
      "  undo",
      "  redo",
    ];
  }
}
