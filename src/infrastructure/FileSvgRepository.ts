import {
  DOMParser,
  XMLSerializer,
  onErrorStopParsing,
  type Document,
  type Element,
} from "@xmldom/xmldom";
import {
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import type { ReadResult, SvgRepository } from "../application/ports/SvgRepository.js";
import { EditorError } from "../domain/EditorError.js";
import type { ShapeFactory } from "../domain/ShapeFactory.js";
import type { Shape } from "../domain/shapes/Shape.js";
import { SvgDocument } from "../domain/SvgDocument.js";

export class FileSvgRepository implements SvgRepository {
  public constructor(private readonly shapeFactory: ShapeFactory) {}

  public read(path: string): ReadResult {
    const source = readFileSync(path, "utf8");
    const xml = new DOMParser({ onError: onErrorStopParsing }).parseFromString(
      source,
      "image/svg+xml",
    );
    const root = xml.documentElement;
    if (root === null || this.elementName(root) !== "svg") {
      throw new EditorError("root element must be <svg>");
    }

    const width = this.dimension(root, "width");
    const height = this.dimension(root, "height");
    const ids = this.collectExplicitIds(root);
    const counters = new Map<string, number>();
    const warnings: string[] = [];
    const shapes = this.childElements(root).map((element) =>
      this.readShape(element, ids, counters, warnings),
    );
    return {
      document: new SvgDocument(width, height, shapes),
      warnings,
    };
  }

  public write(path: string, document: SvgDocument): void {
    const xml = new DOMParser({ onError: onErrorStopParsing }).parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg"/>`,
      "image/svg+xml",
    );
    const root = xml.documentElement;
    if (root === null) {
      throw new EditorError("cannot create SVG document");
    }
    root.setAttribute("width", String(document.width));
    root.setAttribute("height", String(document.height));
    root.setAttribute(
      "viewBox",
      `0 0 ${document.width} ${document.height}`,
    );
    for (const shape of document.children) {
      root.appendChild(this.writeShape(xml, shape));
    }

    const serialized = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(xml)}\n`;
    const temporaryPath = `${path}.tmp-${process.pid}`;
    try {
      writeFileSync(temporaryPath, serialized, "utf8");
      renameSync(temporaryPath, path);
    } catch (error: unknown) {
      try {
        unlinkSync(temporaryPath);
      } catch {
        // The temporary file may not have been created.
      }
      throw error;
    }
  }

  private readShape(
    element: Element,
    ids: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): Shape {
    const tagName = this.elementName(element);
    const attributes = this.attributes(element);
    if (attributes.id === undefined || attributes.id === "") {
      const id = this.nextId(tagName, ids, counters);
      attributes.id = id;
      warnings.push(`warning: assigned id ${id} to unnamed <${tagName}>`);
    }
    const children = this.childElements(element).map((child) =>
      this.readShape(child, ids, counters, warnings),
    );
    return this.shapeFactory.fromSvg(
      tagName,
      attributes,
      element.textContent ?? "",
      children,
    );
  }

  private writeShape(xml: Document, shape: Shape): Element {
    const element = xml.createElement(shape.tagName);
    for (const [name, value] of Object.entries(shape.svgAttributes())) {
      element.setAttribute(name, value);
    }
    if (shape.textContent !== undefined) {
      element.appendChild(xml.createTextNode(shape.textContent));
    }
    for (const child of shape.children) {
      element.appendChild(this.writeShape(xml, child));
    }
    return element;
  }

  private collectExplicitIds(root: Element): Set<string> {
    const ids = new Set<string>();
    const visit = (element: Element): void => {
      const id = element.getAttribute("id");
      if (id !== null && id !== "") {
        if (ids.has(id)) {
          throw new EditorError(`id already exists: ${id}`);
        }
        ids.add(id);
      }
      this.childElements(element).forEach(visit);
    };
    this.childElements(root).forEach(visit);
    return ids;
  }

  private nextId(
    tagName: string,
    ids: Set<string>,
    counters: Map<string, number>,
  ): string {
    let counter = counters.get(tagName) ?? 0;
    let candidate: string;
    do {
      counter += 1;
      candidate = `${tagName}${counter}`;
    } while (ids.has(candidate));
    counters.set(tagName, counter);
    ids.add(candidate);
    return candidate;
  }

  private childElements(element: Element): Element[] {
    const result: Element[] = [];
    for (let index = 0; index < element.childNodes.length; index += 1) {
      const child = element.childNodes.item(index);
      if (child?.nodeType === 1) {
        result.push(child as Element);
      }
    }
    return result;
  }

  private attributes(element: Element): Record<string, string> {
    const result: Record<string, string> = {};
    for (let index = 0; index < element.attributes.length; index += 1) {
      const attribute = element.attributes.item(index);
      if (attribute !== null && attribute.name !== "xmlns") {
        result[attribute.name] = attribute.value;
      }
    }
    return result;
  }

  private dimension(root: Element, name: "width" | "height"): number {
    const value = root.getAttribute(name);
    const number = Number(value);
    if (value === null || !Number.isFinite(number) || number <= 0) {
      throw new EditorError(`invalid SVG ${name}`);
    }
    return number;
  }

  private elementName(element: Element): string {
    return element.localName ?? element.tagName;
  }
}
