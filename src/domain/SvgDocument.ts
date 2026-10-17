import { EditorError } from "./EditorError.js";
import { GroupShape } from "./shapes/GroupShape.js";
import type { Shape } from "./shapes/Shape.js";

export interface ShapeLocation {
  readonly shape: Shape;
  readonly parent: GroupShape | undefined;
  readonly index: number;
}

export class SvgDocument {
  private readonly rootShapes: Shape[];

  public constructor(
    private canvasWidth: number,
    private canvasHeight: number,
    shapes: readonly Shape[] = [],
  ) {
    this.rootShapes = [...shapes];
    this.validateDimensions(canvasWidth, canvasHeight);
    this.validateUniqueIds();
  }

  public get width(): number {
    return this.canvasWidth;
  }

  public get height(): number {
    return this.canvasHeight;
  }

  public get children(): readonly Shape[] {
    return this.rootShapes;
  }

  public clone(): SvgDocument {
    return new SvgDocument(
      this.canvasWidth,
      this.canvasHeight,
      this.rootShapes.map((shape) => shape.clone()),
    );
  }

  public resize(width: number, height: number): void {
    this.validateDimensions(width, height);
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public count(): number {
    return this.allShapes().length;
  }

  public find(id: string): Shape | undefined {
    return this.locate(id)?.shape;
  }

  public require(id: string): Shape {
    const shape = this.find(id);
    if (shape === undefined) {
      throw new EditorError(`no such shape: ${id}`);
    }
    return shape;
  }

  public requireGroup(id: string): GroupShape {
    const shape = this.find(id);
    if (shape === undefined) {
      throw new EditorError(`no such container: ${id}`);
    }
    if (!(shape instanceof GroupShape)) {
      throw new EditorError(`not a container: ${id}`);
    }
    return shape;
  }

  public parentLabel(id: string): string {
    const location = this.locate(id);
    if (location === undefined) {
      throw new EditorError(`no such shape: ${id}`);
    }
    return location.parent === undefined ? "svg" : `g#${location.parent.id}`;
  }

  public add(shape: Shape, parentId?: string): void {
    this.assertTreeCanBeAdded(shape);
    if (parentId === undefined) {
      this.rootShapes.push(shape);
      return;
    }
    this.requireGroup(parentId).add(shape);
  }

  public remove(id: string): Shape {
    const location = this.locate(id);
    if (location === undefined) {
      throw new EditorError(`no such shape: ${id}`);
    }
    if (location.parent === undefined) {
      const [removed] = this.rootShapes.splice(location.index, 1);
      if (removed !== undefined) {
        return removed;
      }
    } else {
      const removed = location.parent.remove(id);
      if (removed !== undefined) {
        return removed.shape;
      }
    }
    throw new EditorError(`no such shape: ${id}`);
  }

  public group(newId: string, ids: readonly string[]): GroupShape {
    if (ids.length === 0) {
      throw new EditorError("group requires at least one shape");
    }
    if (this.find(newId) !== undefined) {
      throw new EditorError(`id already exists: ${newId}`);
    }

    const selected = ids.map((id) => this.require(id));
    if (new Set(ids).size !== ids.length) {
      throw new EditorError("group contains duplicate shape ids");
    }
    for (const candidate of selected) {
      const descendantSelected = selected.some(
        (other) => other !== candidate && candidate.contains(other.id),
      );
      if (descendantSelected) {
        throw new EditorError(
          `cannot group a container into its own descendant: ${candidate.id}`,
        );
      }
    }

    const order = new Map(
      this.allShapes().map((shape, index) => [shape.id, index] as const),
    );
    const ordered = [...selected].sort(
      (left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0),
    );
    const children = ordered.map((shape) => this.remove(shape.id));
    const group = new GroupShape(newId, children);
    this.rootShapes.push(group);
    return group;
  }

  public ungroup(id: string): number {
    const location = this.locate(id);
    if (location === undefined) {
      throw new EditorError(`no such shape: ${id}`);
    }
    if (!(location.shape instanceof GroupShape)) {
      throw new EditorError(`not a container: ${id}`);
    }
    if (location.parent === undefined) {
      throw new EditorError(`cannot ungroup top-level container: ${id}`);
    }

    const children = [...location.shape.children];
    location.parent.remove(id);
    children.forEach((child, offset) => {
      location.parent?.add(child, location.index + offset);
    });
    return children.length;
  }

  public moveInto(groupId: string, shapeId: string): void {
    const group = this.requireGroup(groupId);
    const shape = this.require(shapeId);
    if (shape.contains(groupId)) {
      throw new EditorError(
        `cannot add a container into its own descendant: ${shapeId}`,
      );
    }
    this.remove(shapeId);
    group.add(shape);
  }

  public bringToFront(id: string): void {
    this.reorder(id, true);
  }

  public sendToBack(id: string): void {
    this.reorder(id, false);
  }

  private reorder(id: string, front: boolean): void {
    const location = this.locate(id);
    if (location === undefined) {
      throw new EditorError(`no such shape: ${id}`);
    }
    const siblings =
      location.parent === undefined ? this.rootShapes : location.parent.children;
    const targetIndex = front ? siblings.length - 1 : 0;
    if (location.parent === undefined) {
      const [shape] = this.rootShapes.splice(location.index, 1);
      if (shape !== undefined) {
        this.rootShapes.splice(targetIndex, 0, shape);
      }
    } else {
      location.parent.reorder(id, targetIndex);
    }
  }

  private locate(id: string): ShapeLocation | undefined {
    return this.locateIn(this.rootShapes, id);
  }

  private locateIn(
    shapes: readonly Shape[],
    id: string,
    parent?: GroupShape,
  ): ShapeLocation | undefined {
    for (const [index, shape] of shapes.entries()) {
      if (shape.id === id) {
        return { shape, parent, index };
      }
      if (shape instanceof GroupShape) {
        const nested = this.locateIn(shape.children, id, shape);
        if (nested !== undefined) {
          return nested;
        }
      }
    }
    return undefined;
  }

  private allShapes(): Shape[] {
    const result: Shape[] = [];
    const visit = (shapes: readonly Shape[]): void => {
      for (const shape of shapes) {
        result.push(shape);
        visit(shape.children);
      }
    };
    visit(this.rootShapes);
    return result;
  }

  private assertTreeCanBeAdded(shape: Shape): void {
    const incomingIds = new Set<string>();
    const visit = (node: Shape): void => {
      if (incomingIds.has(node.id) || this.find(node.id) !== undefined) {
        throw new EditorError(`id already exists: ${node.id}`);
      }
      incomingIds.add(node.id);
      node.children.forEach(visit);
    };
    visit(shape);
  }

  private validateUniqueIds(): void {
    const ids = new Set<string>();
    for (const shape of this.allShapes()) {
      if (ids.has(shape.id)) {
        throw new EditorError(`id already exists: ${shape.id}`);
      }
      ids.add(shape.id);
    }
  }

  private validateDimensions(width: number, height: number): void {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new EditorError("canvas dimensions must be positive numbers");
    }
  }
}
