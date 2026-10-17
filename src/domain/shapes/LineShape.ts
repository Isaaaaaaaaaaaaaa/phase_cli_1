import { Shape, type ShapeOptions } from "./Shape.js";

export class LineShape extends Shape {
  public constructor(
    id: string,
    private x1: number,
    private y1: number,
    private x2: number,
    private y2: number,
    options: ShapeOptions = {},
  ) {
    super(id, options);
  }

  public override get tagName(): string {
    return "line";
  }

  public override move(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  public override scale(factor: number): void {
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  public override clone(): LineShape {
    return new LineShape(
      this.id,
      this.x1,
      this.y1,
      this.x2,
      this.y2,
      this.copyOptions(),
    );
  }

  public override summary(): string {
    const style = this.styleSummary();
    return `line#${this.id} (${this.x1},${this.y1}) -> (${this.x2},${this.y2})${style === "" ? "" : ` ${style}`}`;
  }

  public override geometryDetails(): string {
    return `x1=${this.x1} y1=${this.y1} x2=${this.x2} y2=${this.y2}`;
  }

  protected override geometryAttributes(): Readonly<Record<string, string>> {
    return {
      x1: String(this.x1),
      y1: String(this.y1),
      x2: String(this.x2),
      y2: String(this.y2),
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
    switch (name) {
      case "x1":
        this.x1 = this.number(value, name);
        break;
      case "y1":
        this.y1 = this.number(value, name);
        break;
      case "x2":
        this.x2 = this.number(value, name);
        break;
      case "y2":
        this.y2 = this.number(value, name);
        break;
      default:
        return { matched: false };
    }
    return previous === undefined
      ? { matched: true }
      : { matched: true, previous };
  }
}
