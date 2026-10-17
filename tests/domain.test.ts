import { describe, expect, it } from "vitest";
import { ShapeFactory } from "../src/domain/ShapeFactory.js";
import { GroupShape } from "../src/domain/shapes/GroupShape.js";
import { RectShape } from "../src/domain/shapes/RectShape.js";
import { SvgDocument } from "../src/domain/SvgDocument.js";

describe("SVG domain model", () => {
  it("maintains global identity and container invariants", () => {
    const document = new SvgDocument(100, 100);
    document.add(new GroupShape("g1"));
    document.add(new RectShape("r1", 1, 2, 3, 4), "g1");

    expect(document.count()).toBe(2);
    expect(document.parentLabel("r1")).toBe("g#g1");
    expect(() => document.add(new RectShape("r1", 0, 0, 1, 1))).toThrow(
      "id already exists: r1",
    );
    expect(() => document.requireGroup("missing")).toThrow(
      "no such container: missing",
    );
    expect(() => document.requireGroup("r1")).toThrow("not a container: r1");
    expect(() => document.ungroup("g1")).toThrow(
      "cannot ungroup top-level container: g1",
    );
  });

  it("preserves source order when grouping and supports reparenting", () => {
    const document = new SvgDocument(100, 100, [
      new RectShape("a", 0, 0, 1, 1),
      new RectShape("b", 1, 1, 1, 1),
      new RectShape("c", 2, 2, 1, 1),
      new GroupShape("host"),
    ]);

    const group = document.group("selected", ["c", "a"]);
    expect(group.children.map((shape) => shape.id)).toEqual(["a", "c"]);
    document.moveInto("host", "selected");
    expect(document.parentLabel("selected")).toBe("g#host");
    expect(document.ungroup("selected")).toBe(2);
    expect(document.requireGroup("host").children.map((shape) => shape.id)).toEqual([
      "a",
      "c",
    ]);
    document.bringToFront("b");
    document.sendToBack("host");
    expect(document.children.map((shape) => shape.id)).toEqual(["host", "b"]);
  });

  it("rejects invalid grouping and dimensions", () => {
    const nested = new GroupShape("outer", [
      new GroupShape("inner", [new RectShape("r", 0, 0, 1, 1)]),
    ]);
    const document = new SvgDocument(10, 10, [nested]);

    expect(() => document.group("empty", [])).toThrow(
      "group requires at least one shape",
    );
    expect(() => document.group("duplicate", ["r", "r"])).toThrow(
      "group contains duplicate shape ids",
    );
    expect(() => document.group("cycle", ["outer", "r"])).toThrow(
      "cannot group a container into its own descendant: outer",
    );
    expect(() => document.resize(0, 10)).toThrow(
      "canvas dimensions must be positive numbers",
    );
    expect(() => new SvgDocument(Number.NaN, 10)).toThrow(
      "canvas dimensions must be positive numbers",
    );
  });

  it("uses the factory as the only type-name dispatch point", () => {
    const factory = new ShapeFactory();
    const line = factory.create("line", "l1", ["0", "1", "2", "3", "red"]);
    expect(line.summary()).toBe("line#l1 (0,1) -> (2,3) stroke=red");
    line.move(2, 3);
    line.scale(2);
    expect(line.geometryDetails()).toBe("x1=4 y1=8 x2=8 y2=12");

    expect(() => factory.create("rect", "r1", ["0"])).toThrow(
      "invalid arguments for rect",
    );
    expect(() => factory.fromSvg("path", { id: "p1" }, "", [])).toThrow(
      "unsupported SVG element: path",
    );
    expect(() => factory.fromSvg("rect", {}, "", [])).toThrow(
      "missing id on <rect>",
    );
    expect(() =>
      factory.fromSvg("rect", { id: "r1", x: "0" }, "", []),
    ).toThrow("missing SVG attribute: y");
  });

  it("applies polymorphic geometry and attribute behavior to every shape", () => {
    const factory = new ShapeFactory();
    const rect = factory.create("rect", "r", ["1", "2", "3", "4"]);
    const circle = factory.create("circle", "c", ["1", "2", "3", "red"]);
    const ellipse = factory.create("ellipse", "e", ["1", "2", "3", "4"]);
    const line = factory.create("line", "l", ["1", "2", "3", "4"]);
    const text = factory.create("text", "t", ["1", "2", "content"]);
    const group = new GroupShape("g", [rect, circle, ellipse, line, text]);

    expect(rect.setAttribute("x", "10")).toBe("1");
    expect(rect.setAttribute("y", "20")).toBe("2");
    expect(rect.setAttribute("width", "30")).toBe("3");
    expect(rect.setAttribute("height", "40")).toBe("4");
    expect(circle.setAttribute("cx", "10")).toBe("1");
    expect(circle.setAttribute("cy", "20")).toBe("2");
    expect(circle.setAttribute("r", "30")).toBe("3");
    expect(ellipse.setAttribute("cx", "10")).toBe("1");
    expect(ellipse.setAttribute("cy", "20")).toBe("2");
    expect(ellipse.setAttribute("rx", "30")).toBe("3");
    expect(ellipse.setAttribute("ry", "40")).toBe("4");
    expect(line.setAttribute("x1", "10")).toBe("1");
    expect(line.setAttribute("y1", "20")).toBe("2");
    expect(line.setAttribute("x2", "30")).toBe("3");
    expect(line.setAttribute("y2", "40")).toBe("4");
    expect(text.setAttribute("x", "10")).toBe("1");
    expect(text.setAttribute("y", "20")).toBe("2");
    expect(text.setAttribute("text", "updated")).toBe("content");
    expect(text.setAttribute("fill", "blue")).toBeUndefined();
    expect(text.setAttribute("fill", "green")).toBe("blue");
    expect(text.getAttribute("missing")).toBeUndefined();

    group.move(1, 2);
    group.scale(2);
    expect(group.clone().children).toHaveLength(5);
    expect(group.contains("t")).toBe(true);
    expect(group.contains("missing")).toBe(false);
    expect(group.remove("missing")).toBeUndefined();
    group.reorder("missing", 0);
    expect(() => group.setAttribute("opacity", "1")).toThrow(
      "unknown attribute: opacity",
    );
    expect(() => rect.setAttribute("x", "bad")).toThrow(
      "invalid number for x: bad",
    );
  });
});
