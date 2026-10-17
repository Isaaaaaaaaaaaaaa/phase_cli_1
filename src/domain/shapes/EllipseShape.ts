import { Shape, type ShapeOptions } from "./Shape.js";

export class EllipseShape extends Shape {
  public constructor(
    id: string,
    private cx: number,
    private cy: number,
    private rx: number,
    private ry: number,
    options: ShapeOptions = {},
  ) {
    super(id, options);
  }

  public override get tagName(): string {
    return "ellipse";
  }

  public override move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  public override scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.rx *= factor;
    this.ry *= factor;
  }

  public override clone(): EllipseShape {
    return new EllipseShape(
      this.id,
      this.cx,
      this.cy,
      this.rx,
      this.ry,
      this.copyOptions(),
    );
  }

  public override summary(): string {
    const style = this.styleSummary();
    return `ellipse#${this.id} cx=${this.cx} cy=${this.cy} rx=${this.rx} ry=${this.ry}${style === "" ? "" : ` ${style}`}`;
  }

  public override geometryDetails(): string {
    return `cx=${this.cx} cy=${this.cy} rx=${this.rx} ry=${this.ry}`;
  }

  public override positionSummary(): string {
    return `(${this.cx},${this.cy})`;
  }

  protected override geometryAttributes(): Readonly<Record<string, string>> {
    return {
      cx: String(this.cx),
      cy: String(this.cy),
      rx: String(this.rx),
      ry: String(this.ry),
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
      case "cx":
        this.cx = this.number(value, name);
        break;
      case "cy":
        this.cy = this.number(value, name);
        break;
      case "rx":
        this.rx = this.number(value, name);
        break;
      case "ry":
        this.ry = this.number(value, name);
        break;
      default:
        return { matched: false };
    }
    return previous === undefined
      ? { matched: true }
      : { matched: true, previous };
  }
}
