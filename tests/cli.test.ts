import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { TestHarness } from "./TestHarness.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("SVG editor CLI", () => {
  it("runs the representative editing and history workflow", () => {
    const cli = new TestHarness();

    expect(cli.run("# replay comment")).toEqual([]);
    expect(cli.run("tree")).toEqual([
      "error: no document. use 'init' or 'read' first",
    ]);
    expect(cli.run("undo")).toEqual([
      "error: no document. use 'init' or 'read' first",
    ]);
    expect(cli.run("init 800 600")).toEqual(["canvas 800x600 created"]);
    expect(cli.run("create rect bg 0 0 800 600 #ffffff")).toEqual([
      "rect#bg created",
    ]);
    expect(cli.run('create text title 20 40 "My Diagram"')).toEqual([
      "text#title created",
    ]);
    expect(cli.run("create circle c1 100 100 20 red")).toEqual([
      "circle#c1 created",
    ]);
    expect(cli.run("create rect box 200 80 60 60 #3366ff")).toEqual([
      "rect#box created",
    ]);
    expect(cli.run("group markers c1 box")).toEqual([
      "g#markers created with 2 children",
    ]);
    expect(cli.run("move c1 30 0")).toEqual([
      "circle#c1 moved to (130,100)",
    ]);
    expect(cli.run("undo")).toEqual([
      "circle#c1 moved back to (100,100)",
    ]);
    expect(cli.run("redo")).toEqual(["circle#c1 moved to (130,100)"]);
    expect(cli.run('set title text "My Diagram v2"')).toEqual([
      'text#title updated: text="My Diagram v2"',
    ]);
    expect(cli.run("undo")).toEqual([
      'text#title updated: text="My Diagram"',
    ]);
    expect(cli.run("group bad c1 markers")).toEqual([
      "error: cannot group a container into its own descendant: markers",
    ]);
    expect(cli.run("delete box")).toEqual(["rect#box deleted"]);
    expect(cli.run("undo")).toEqual(["rect#box restored into g#markers"]);

    const tree = cli.run("tree");
    expect(tree).toContain("└── g#markers");
    expect(tree).toContain("    ├── circle#c1 cx=130 cy=100 r=20 fill=red");
    expect(cli.run("show c1")).toEqual([
      "circle#c1  parent=g#markers",
      "  cx=130 cy=100 r=20",
      "  fill=red",
    ]);
  });

  it("supports every shape, hierarchy operation, and z-order command", () => {
    const cli = new TestHarness();
    cli.run("init");
    expect(cli.run("canvas")).toEqual(["canvas 800x600"]);
    cli.run("create g outer");
    cli.run("create ellipse e1 20 30 8 4 blue in outer");
    cli.run("create line l1 0 0 10 10 black in outer");
    cli.run('create text t1 3 4 "hello world" in outer');
    cli.run("create rect a 1 2 3 4");
    cli.run("create circle b 5 6 2");
    cli.run("group inner a b");
    expect(cli.run("addto outer inner")).toEqual([
      "g#inner moved into g#outer",
    ]);
    expect(cli.run("scale outer 2")).toEqual(["g#outer scaled by 2"]);
    expect(cli.run("front e1")).toEqual(["ellipse#e1 brought to front"]);
    expect(cli.run("back e1")).toEqual(["ellipse#e1 sent to back"]);
    expect(cli.run("ungroup inner")).toEqual([
      "g#inner ungrouped (2 children promoted)",
    ]);
    expect(cli.run("undo")).toEqual(["g#inner restored"]);
    expect(cli.run("redo")).toEqual([
      "g#inner ungrouped (2 children promoted)",
    ]);
    expect(cli.run("create g nested in outer")).toEqual([
      "g#nested created in g#outer",
    ]);
    expect(cli.run("addto nested outer")).toEqual([
      "error: cannot add a container into its own descendant: outer",
    ]);
    expect(cli.run("tree outer")[0]).toBe("g#outer");
  });

  it("rejects invalid edits without changing document state", () => {
    const cli = new TestHarness();
    cli.run("init 100 100");
    cli.run("create rect r1 1 2 3 4");

    expect(cli.run("create circle r1 1 1 1")).toEqual([
      "error: id already exists: r1",
    ]);
    expect(cli.run("create hexagon h1 0 0")).toEqual([
      "error: unknown shape type: hexagon (is the plugin loaded?)",
    ]);
    expect(cli.run("scale r1 0")).toEqual([
      "error: scale factor must be positive",
    ]);
    expect(cli.run("set r1 opacity 0.5")).toEqual([
      "error: unknown attribute: opacity",
    ]);
    expect(cli.run("move missing 1 2")).toEqual([
      "error: no such shape: missing",
    ]);
    expect(cli.run('create text bad 1 2 no-quotes')).toEqual([
      'error: usage: create text <id> <x> <y> "content"',
    ]);
    expect(cli.run("show r1")).toEqual([
      "rect#r1  parent=svg",
      "  x=1 y=2 width=3 height=4",
    ]);
    expect(cli.run("nonesuch")).toEqual(["error: unknown command: nonesuch"]);
    expect(cli.run('set r1 fill "unterminated')).toEqual([
      "error: unterminated quoted argument",
    ]);
  });

  it("enforces I/O history barriers and clears redo after a new edit", () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-cli-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "diagram with spaces.svg");
    const cli = new TestHarness();

    cli.run("init 120 80");
    cli.run("create rect r1 1 2 3 4");
    cli.run("move r1 10 0");
    cli.run("undo");
    cli.run("set r1 fill red");
    expect(cli.run("redo")).toEqual(["error: nothing to redo"]);
    expect(cli.run(`save "${path}"`)).toEqual([
      `saved to ${path} (1 elements)`,
    ]);
    expect(cli.run("undo")).toEqual([
      "error: undo not allowed after io command",
    ]);
    cli.run("move r1 1 0");
    expect(cli.run("undo")).toEqual(["rect#r1 moved back to (1,2)"]);
    expect(cli.run("canvas 200 100")).toEqual([
      "canvas resized to 200x100",
    ]);
    expect(cli.run("redo")).toEqual([
      "error: undo not allowed after io command",
    ]);
  });

  it("lists complete help without requiring a document", () => {
    const output = new TestHarness().run("help");
    expect(output).toContain("  create <type> <id> [params...] [in <containerId>]");
    expect(output).toContain("  redo");
  });

  it("undoes each structural command and handles non-positional movement", () => {
    const cli = new TestHarness();
    cli.run("init");
    cli.run("create g g1");
    expect(cli.run("undo")).toEqual(["g#g1 creation undone"]);
    cli.run("redo");
    cli.run("create line edge 0 0 10 10");
    expect(cli.run("move edge 2 3")).toEqual(["line#edge moved by (2,3)"]);
    expect(cli.run("undo")).toEqual(["line#edge moved back by (-2,-3)"]);
    cli.run("scale edge 2");
    expect(cli.run("undo")).toEqual(["line#edge scale restored"]);
    cli.run("set edge stroke red");
    expect(cli.run("undo")).toEqual([
      "line#edge updated: stroke=(unset)",
    ]);
    cli.run("group edges edge");
    expect(cli.run("undo")).toEqual(["g#edges grouping undone"]);
    cli.run("redo");
    cli.run("addto g1 edges");
    expect(cli.run("undo")).toEqual(["g#edges restored into svg"]);
    cli.run("front g1");
    expect(cli.run("undo")).toEqual(["g#g1 z-order restored"]);
    cli.run("back g1");
    expect(cli.run("undo")).toEqual(["g#g1 z-order restored"]);
  });
});
