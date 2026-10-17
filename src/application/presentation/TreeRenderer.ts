import type { Shape } from "../../domain/shapes/Shape.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";

export class TreeRenderer {
  public render(document: SvgDocument, rootId?: string): readonly string[] {
    if (rootId !== undefined) {
      const shape = document.require(rootId);
      return [shape.summary(), ...this.renderChildren(shape.children, "")];
    }
    return [
      `svg (${document.width}x${document.height})`,
      ...this.renderChildren(document.children, ""),
    ];
  }

  private renderChildren(
    children: readonly Shape[],
    prefix: string,
  ): readonly string[] {
    const lines: string[] = [];
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? "└──" : "├──"} ${child.summary()}`);
      lines.push(
        ...this.renderChildren(
          child.children,
          `${prefix}${last ? "    " : "│   "}`,
        ),
      );
    });
    return lines;
  }
}
