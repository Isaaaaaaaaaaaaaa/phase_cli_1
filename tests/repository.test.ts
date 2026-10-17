import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ShapeFactory } from "../src/domain/ShapeFactory.js";
import { FileSvgRepository } from "../src/infrastructure/FileSvgRepository.js";
import { TestHarness } from "./TestHarness.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("SVG file repository", () => {
  it("assigns collision-free IDs and round-trips supported SVG", () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-repository-"));
    temporaryDirectories.push(directory);
    const inputPath = join(directory, "input.svg");
    const outputPath = join(directory, "output.svg");
    writeFileSync(
      inputPath,
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">',
        '  <rect id="rect1" x="0" y="0" width="10" height="10"/>',
        '  <rect x="10" y="20" width="30" height="40" fill="#eee"/>',
        '  <g id="g1" transform="translate(2,3)">',
        '    <text x="5" y="6">A &amp; B</text>',
        "  </g>",
        "</svg>",
      ].join("\n"),
      "utf8",
    );
    const repository = new FileSvgRepository(new ShapeFactory());

    const result = repository.read(inputPath);
    expect(result.warnings).toEqual([
      "warning: assigned id rect2 to unnamed <rect>",
      "warning: assigned id text1 to unnamed <text>",
    ]);
    expect(result.document.count()).toBe(4);
    repository.write(outputPath, result.document);

    const serialized = readFileSync(outputPath, "utf8");
    expect(serialized).toContain('id="rect2"');
    expect(serialized).toContain('transform="translate(2,3)"');
    expect(serialized).toContain(">A &amp; B</text>");
    const roundTrip = repository.read(outputPath);
    expect(roundTrip.warnings).toEqual([]);
    expect(roundTrip.document.count()).toBe(4);
  });

  it("rejects duplicate IDs and malformed dimensions", () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-repository-"));
    temporaryDirectories.push(directory);
    const duplicatePath = join(directory, "duplicate.svg");
    const dimensionPath = join(directory, "dimension.svg");
    writeFileSync(
      duplicatePath,
      '<svg width="10" height="10"><rect id="x" x="0" y="0" width="1" height="1"/><circle id="x" cx="1" cy="1" r="1"/></svg>',
    );
    writeFileSync(
      dimensionPath,
      '<svg width="bad" height="10"><rect id="x" x="0" y="0" width="1" height="1"/></svg>',
    );
    const repository = new FileSvgRepository(new ShapeFactory());

    expect(() => repository.read(duplicatePath)).toThrow(
      "id already exists: x",
    );
    expect(() => repository.read(dimensionPath)).toThrow("invalid SVG width");
  });

  it("reports file failures through CLI errors", () => {
    const cli = new TestHarness();
    expect(cli.run("read /path/that/does/not/exist.svg")).toEqual([
      "error: cannot read file: /path/that/does/not/exist.svg",
    ]);
    cli.run("init");
    expect(cli.run("save")).toEqual([
      "error: no file path. use 'save <file.svg>' first",
    ]);
    expect(cli.run("save /missing-directory/file.svg")).toEqual([
      "error: cannot write file: /missing-directory/file.svg",
    ]);
  });
});
