import { EditorError } from "./EditorError.js";
import { CircleShape } from "./shapes/CircleShape.js";
import { EllipseShape } from "./shapes/EllipseShape.js";
import { GroupShape } from "./shapes/GroupShape.js";
import { LineShape } from "./shapes/LineShape.js";
import { RectShape } from "./shapes/RectShape.js";
import type { Shape, ShapeOptions } from "./shapes/Shape.js";
import { TextShape } from "./shapes/TextShape.js";

type CliCreator = (id: string, args: readonly string[]) => Shape;
type SvgCreator = (
  id: string,
  attributes: Readonly<Record<string, string>>,
  text: string,
  children: readonly Shape[],
) => Shape;

export class ShapeFactory {
  private readonly cliCreators = new Map<string, CliCreator>([
    ["rect", (id, args) => this.createRect(id, args)],
    ["circle", (id, args) => this.createCircle(id, args)],
    ["ellipse", (id, args) => this.createEllipse(id, args)],
    ["line", (id, args) => this.createLine(id, args)],
    ["text", (id, args) => this.createText(id, args)],
    ["g", (id, args) => this.createGroup(id, args)],
  ]);

  private readonly svgCreators = new Map<string, SvgCreator>([
    ["rect", (id, attrs) => this.hydrateRect(id, attrs)],
    ["circle", (id, attrs) => this.hydrateCircle(id, attrs)],
    ["ellipse", (id, attrs) => this.hydrateEllipse(id, attrs)],
    ["line", (id, attrs) => this.hydrateLine(id, attrs)],
    ["text", (id, attrs, text) => this.hydrateText(id, attrs, text)],
    [
      "g",
      (id, attrs, _text, children) =>
        new GroupShape(
          id,
          children,
          this.options(attrs, ["id"]),
        ),
    ],
  ]);

  public create(type: string, id: string, args: readonly string[]): Shape {
    const creator = this.cliCreators.get(type);
    if (creator === undefined) {
      throw new EditorError(
        `unknown shape type: ${type} (is the plugin loaded?)`,
      );
    }
    return creator(id, args);
  }

  public fromSvg(
    tagName: string,
    attributes: Readonly<Record<string, string>>,
    text: string,
    children: readonly Shape[],
  ): Shape {
    const creator = this.svgCreators.get(tagName);
    if (creator === undefined) {
      throw new EditorError(`unsupported SVG element: ${tagName}`);
    }
    const id = attributes.id;
    if (id === undefined || id === "") {
      throw new EditorError(`missing id on <${tagName}>`);
    }
    return creator(id, attributes, text, children);
  }

  private createRect(id: string, args: readonly string[]): RectShape {
    this.arity("rect", args, 4, 5);
    return new RectShape(
      id,
      this.number(args[0], "x"),
      this.number(args[1], "y"),
      this.number(args[2], "width"),
      this.number(args[3], "height"),
      this.optionalStyle("fill", args[4]),
    );
  }

  private createCircle(id: string, args: readonly string[]): CircleShape {
    this.arity("circle", args, 3, 4);
    return new CircleShape(
      id,
      this.number(args[0], "cx"),
      this.number(args[1], "cy"),
      this.number(args[2], "r"),
      this.optionalStyle("fill", args[3]),
    );
  }

  private createEllipse(id: string, args: readonly string[]): EllipseShape {
    this.arity("ellipse", args, 4, 5);
    return new EllipseShape(
      id,
      this.number(args[0], "cx"),
      this.number(args[1], "cy"),
      this.number(args[2], "rx"),
      this.number(args[3], "ry"),
      this.optionalStyle("fill", args[4]),
    );
  }

  private createLine(id: string, args: readonly string[]): LineShape {
    this.arity("line", args, 4, 5);
    return new LineShape(
      id,
      this.number(args[0], "x1"),
      this.number(args[1], "y1"),
      this.number(args[2], "x2"),
      this.number(args[3], "y2"),
      this.optionalStyle("stroke", args[4]),
    );
  }

  private createText(id: string, args: readonly string[]): TextShape {
    this.arity("text", args, 3, 3);
    return new TextShape(
      id,
      this.number(args[0], "x"),
      this.number(args[1], "y"),
      args[2] ?? "",
    );
  }

  private createGroup(id: string, args: readonly string[]): GroupShape {
    this.arity("g", args, 0, 0);
    return new GroupShape(id);
  }

  private hydrateRect(
    id: string,
    attributes: Readonly<Record<string, string>>,
  ): RectShape {
    return new RectShape(
      id,
      this.attributeNumber(attributes, "x"),
      this.attributeNumber(attributes, "y"),
      this.attributeNumber(attributes, "width"),
      this.attributeNumber(attributes, "height"),
      this.options(attributes, ["id", "x", "y", "width", "height"]),
    );
  }

  private hydrateCircle(
    id: string,
    attributes: Readonly<Record<string, string>>,
  ): CircleShape {
    return new CircleShape(
      id,
      this.attributeNumber(attributes, "cx"),
      this.attributeNumber(attributes, "cy"),
      this.attributeNumber(attributes, "r"),
      this.options(attributes, ["id", "cx", "cy", "r"]),
    );
  }

  private hydrateEllipse(
    id: string,
    attributes: Readonly<Record<string, string>>,
  ): EllipseShape {
    return new EllipseShape(
      id,
      this.attributeNumber(attributes, "cx"),
      this.attributeNumber(attributes, "cy"),
      this.attributeNumber(attributes, "rx"),
      this.attributeNumber(attributes, "ry"),
      this.options(attributes, ["id", "cx", "cy", "rx", "ry"]),
    );
  }

  private hydrateLine(
    id: string,
    attributes: Readonly<Record<string, string>>,
  ): LineShape {
    return new LineShape(
      id,
      this.attributeNumber(attributes, "x1"),
      this.attributeNumber(attributes, "y1"),
      this.attributeNumber(attributes, "x2"),
      this.attributeNumber(attributes, "y2"),
      this.options(attributes, ["id", "x1", "y1", "x2", "y2"]),
    );
  }

  private hydrateText(
    id: string,
    attributes: Readonly<Record<string, string>>,
    text: string,
  ): TextShape {
    return new TextShape(
      id,
      this.attributeNumber(attributes, "x"),
      this.attributeNumber(attributes, "y"),
      text,
      this.options(attributes, ["id", "x", "y"]),
    );
  }

  private options(
    attributes: Readonly<Record<string, string>>,
    consumed: readonly string[],
  ): ShapeOptions {
    const styles: Record<string, string> = {};
    const extras: Record<string, string> = {};
    const consumedNames = new Set(consumed);
    for (const [name, value] of Object.entries(attributes)) {
      if (consumedNames.has(name)) {
        continue;
      }
      if (name === "fill" || name === "stroke" || name === "stroke-width") {
        styles[name] = value;
      } else {
        extras[name] = value;
      }
    }
    return { styles, extras };
  }

  private optionalStyle(name: string, value?: string): ShapeOptions {
    return value === undefined ? {} : { styles: { [name]: value } };
  }

  private attributeNumber(
    attributes: Readonly<Record<string, string>>,
    name: string,
  ): number {
    const value = attributes[name];
    if (value === undefined) {
      throw new EditorError(`missing SVG attribute: ${name}`);
    }
    return this.number(value, name);
  }

  private number(value: string | undefined, name: string): number {
    const parsed = Number(value);
    if (value === undefined || !Number.isFinite(parsed)) {
      throw new EditorError(`invalid number for ${name}: ${value ?? ""}`);
    }
    return parsed;
  }

  private arity(
    type: string,
    args: readonly string[],
    minimum: number,
    maximum: number,
  ): void {
    if (args.length < minimum || args.length > maximum) {
      throw new EditorError(`invalid arguments for ${type}`);
    }
  }
}
