import { EditorError } from "../EditorError.js";

export interface ShapeOptions {
  readonly styles?: Readonly<Record<string, string>>;
  readonly extras?: Readonly<Record<string, string>>;
}

export abstract class Shape {
  private static readonly STYLE_ATTRIBUTES = new Set([
    "fill",
    "stroke",
    "stroke-width",
  ]);

  private readonly styles = new Map<string, string>();
  private readonly extras = new Map<string, string>();

  protected constructor(
    private readonly shapeId: string,
    options: ShapeOptions = {},
  ) {
    if (shapeId === "") {
      throw new EditorError("shape id must not be empty");
    }
    for (const [name, value] of Object.entries(options.styles ?? {})) {
      this.styles.set(name, value);
    }
    for (const [name, value] of Object.entries(options.extras ?? {})) {
      this.extras.set(name, value);
    }
  }

  public get id(): string {
    return this.shapeId;
  }

  public abstract get tagName(): string;

  public get textContent(): string | undefined {
    return undefined;
  }

  public get children(): readonly Shape[] {
    return [];
  }

  public abstract move(dx: number, dy: number): void;

  public abstract scale(factor: number): void;

  public abstract clone(): Shape;

  public abstract summary(): string;

  public abstract geometryDetails(): string;

  public positionSummary(): string | undefined {
    return undefined;
  }

  public setAttribute(name: string, value: string): string | undefined {
    if (Shape.STYLE_ATTRIBUTES.has(name)) {
      const previous = this.styles.get(name);
      this.styles.set(name, value);
      return previous;
    }

    const result = this.setSpecificAttribute(name, value);
    if (!result.matched) {
      throw new EditorError(`unknown attribute: ${name}`);
    }
    return result.previous;
  }

  public getAttribute(name: string): string | undefined {
    if (Shape.STYLE_ATTRIBUTES.has(name)) {
      return this.styles.get(name);
    }
    return this.getSpecificAttribute(name);
  }

  public svgAttributes(): Readonly<Record<string, string>> {
    return {
      id: this.id,
      ...Object.fromEntries(this.styles),
      ...Object.fromEntries(this.extras),
      ...this.geometryAttributes(),
    };
  }

  public contains(id: string): boolean {
    return this.id === id || this.children.some((child) => child.contains(id));
  }

  protected styleSummary(): string {
    return [...this.styles.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join(" ");
  }

  protected copyOptions(): ShapeOptions {
    return {
      styles: Object.fromEntries(this.styles),
      extras: Object.fromEntries(this.extras),
    };
  }

  protected number(value: string, attribute: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new EditorError(`invalid number for ${attribute}: ${value}`);
    }
    return parsed;
  }

  protected abstract geometryAttributes(): Readonly<Record<string, string>>;

  protected abstract getSpecificAttribute(name: string): string | undefined;

  protected abstract setSpecificAttribute(
    name: string,
    value: string,
  ): { readonly matched: boolean; readonly previous?: string };
}
