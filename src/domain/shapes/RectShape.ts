import { Shape, type ShapeOptions } from "./Shape.js";

export class RectShape extends Shape {
  public constructor(
    id: string,
    private x: number,
    private y: number,
    private width: number,
    private height: number,
    options: ShapeOptions = {},
  ) {
    super(id, options);
  }

  public override get tagName(): string {
    return "rect";
  }

  public override move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public override scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  public override clone(): RectShape {
    return new RectShape(
      this.id,
      this.x,
      this.y,
      this.width,
      this.height,
      this.copyOptions(),
    );
  }

  public override summary(): string {
    const style = this.styleSummary();
    return `rect#${this.id} x=${this.x} y=${this.y} w=${this.width} h=${this.height}${style === "" ? "" : ` ${style}`}`;
  }

  public override geometryDetails(): string {
    return `x=${this.x} y=${this.y} width=${this.width} height=${this.height}`;
  }

  protected override geometryAttributes(): Readonly<Record<string, string>> {
    return {
      x: String(this.x),
      y: String(this.y),
      width: String(this.width),
      height: String(this.height),
    };
  }

  protected override getSpecificAttribute(name: string): string | undefined {
    return this.geometryAttributes()[name];
  }

  protected override setSpecificAttribute(
    name: string,
    value: string,
  ): { readonly matched: boolean; readonly previous?: string } {
    const previous = this.getSpecificAttribute(name);
    const numeric = this.number(value, name);
    switch (name) {
      case "x":
        this.x = numeric;
        break;
      case "y":
        this.y = numeric;
        break;
      case "width":
        this.width = numeric;
        break;
      case "height":
        this.height = numeric;
        break;
      default:
        return { matched: false };
    }
    return previous === undefined
      ? { matched: true }
      : { matched: true, previous };
  }
}
