import { Shape, type ShapeOptions } from "./Shape.js";

export class TextShape extends Shape {
  public constructor(
    id: string,
    private x: number,
    private y: number,
    private content: string,
    options: ShapeOptions = {},
  ) {
    super(id, options);
  }

  public override get tagName(): string {
    return "text";
  }

  public override get textContent(): string {
    return this.content;
  }

  public override move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public override scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  public override clone(): TextShape {
    return new TextShape(
      this.id,
      this.x,
      this.y,
      this.content,
      this.copyOptions(),
    );
  }

  public override summary(): string {
    const style = this.styleSummary();
    return `text#${this.id} (${this.x},${this.y}) "${this.content}"${style === "" ? "" : ` ${style}`}`;
  }

  public override geometryDetails(): string {
    return `x=${this.x} y=${this.y}\n  text="${this.content}"`;
  }

  protected override geometryAttributes(): Readonly<Record<string, string>> {
    return { x: String(this.x), y: String(this.y) };
  }

  protected override getSpecificAttribute(name: string): string | undefined {
    if (name === "text") {
      return this.content;
    }
    return this.geometryAttributes()[name];
  }

  protected override setSpecificAttribute(
    name: string,
    value: string,
  ): { readonly matched: boolean; readonly previous?: string } {
    const previous = this.getSpecificAttribute(name);
    switch (name) {
      case "x":
        this.x = this.number(value, name);
        break;
      case "y":
        this.y = this.number(value, name);
        break;
      case "text":
        this.content = value;
        break;
      default:
        return { matched: false };
    }
    return previous === undefined
      ? { matched: true }
      : { matched: true, previous };
  }
}
