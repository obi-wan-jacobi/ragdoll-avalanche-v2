import { PoseComponent, ShapeComponent } from '@plasmastrapi/ecs';
import { IPoint, IShape } from '@plasmastrapi/geometry';
import { HTML5CanvasElement } from '@plasmastrapi/html5-canvas';

export default class Handle extends HTML5CanvasElement {
  public constructor({ x, y }: IPoint) {
    super();
    this.$add(PoseComponent, { x, y, a: 0 });
    this.$add(ShapeComponent, calculatePolygonVertices(3, 50));
  }
}

function calculatePolygonVertices(numSides: number, sideLength: number): IShape {
  const vertices: IPoint[] = [];
  const angleIncrement = (2 * Math.PI) / numSides; // Angle between each vertex

  for (let i = 0; i < numSides; i++) {
    const angle = i * angleIncrement;
    const x = sideLength * Math.cos(angle);
    const y = sideLength * Math.sin(angle);
    vertices.push({ x, y });
  }

  return { vertices };
}
