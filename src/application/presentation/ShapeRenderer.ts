import type { Shape } from "../../domain/shapes/Shape.js";

export class ShapeRenderer {
  public render(shape: Shape, parent: string): readonly string[] {
    const lines = [`${shape.tagName}#${shape.id}  parent=${parent}`];
    for (const detail of shape.geometryDetails().split("\n")) {
      lines.push(`  ${detail.trimStart()}`);
    }
    const styles = ["fill", "stroke", "stroke-width"]
      .map((name) => {
        const value = shape.getAttribute(name);
        return value === undefined ? undefined : `${name}=${value}`;
      })
      .filter((value): value is string => value !== undefined);
    if (styles.length > 0) {
      lines.push(`  ${styles.join(" ")}`);
    }
    return lines;
  }
}
