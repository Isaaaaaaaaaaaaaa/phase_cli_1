import { Shape, type ShapeOptions } from "./Shape.js";

export class CircleShape extends Shape {
  public constructor(
    id: string,
    private cx: number,
    private cy: number,
    private radius: number,
    options: ShapeOptions = {},
  ) {
    super(id, options);
  }

  public override get tagName(): string {
    return "circle";
  }

  public override move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  public override scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.radius *= factor;
  }

  public override clone(): CircleShape {
    return new CircleShape(
      this.id,
      this.cx,
      this.cy,
      this.radius,
      this.copyOptions(),
    );
  }

  public override summary(): string {
    const style = this.styleSummary();
    return `circle#${this.id} cx=${this.cx} cy=${this.cy} r=${this.radius}${style === "" ? "" : ` ${style}`}`;
  }

  public override geometryDetails(): string {
    return `cx=${this.cx} cy=${this.cy} r=${this.radius}`;
  }

  protected override geometryAttributes(): Readonly<Record<string, string>> {
    return { cx: String(this.cx), cy: String(this.cy), r: String(this.radius) };
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
      case "r":
        this.radius = this.number(value, name);
        break;
      default:
        return { matched: false };
    }
    return previous === undefined
      ? { matched: true }
      : { matched: true, previous };
  }
}
