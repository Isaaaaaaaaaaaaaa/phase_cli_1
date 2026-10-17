import { Shape, type ShapeOptions } from "./Shape.js";

export class GroupShape extends Shape {
  private readonly childShapes: Shape[];

  public constructor(
    id: string,
    children: readonly Shape[] = [],
    options: ShapeOptions = {},
  ) {
    super(id, options);
    this.childShapes = [...children];
  }

  public override get tagName(): string {
    return "g";
  }

  public override get children(): readonly Shape[] {
    return this.childShapes;
  }

  public override move(dx: number, dy: number): void {
    for (const child of this.childShapes) {
      child.move(dx, dy);
    }
  }

  public override scale(factor: number): void {
    for (const child of this.childShapes) {
      child.scale(factor);
    }
  }

  public override clone(): GroupShape {
    return new GroupShape(
      this.id,
      this.childShapes.map((child) => child.clone()),
      this.copyOptions(),
    );
  }

  public override summary(): string {
    const style = this.styleSummary();
    return `g#${this.id}${style === "" ? "" : ` ${style}`}`;
  }

  public override geometryDetails(): string {
    return `children=${this.childShapes.length}`;
  }

  public add(child: Shape, index = this.childShapes.length): void {
    this.childShapes.splice(index, 0, child);
  }

  public remove(id: string): { readonly shape: Shape; readonly index: number } | undefined {
    const index = this.childShapes.findIndex((child) => child.id === id);
    if (index < 0) {
      return undefined;
    }
    const [shape] = this.childShapes.splice(index, 1);
    return shape === undefined ? undefined : { shape, index };
  }

  public reorder(id: string, index: number): void {
    const removed = this.remove(id);
    if (removed !== undefined) {
      this.add(removed.shape, index);
    }
  }

  protected override geometryAttributes(): Readonly<Record<string, string>> {
    return {};
  }

  protected override getSpecificAttribute(): string | undefined {
    return undefined;
  }

  protected override setSpecificAttribute(): {
    readonly matched: boolean;
    readonly previous?: string;
  } {
    return { matched: false };
  }
}
