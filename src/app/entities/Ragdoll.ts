import { PoseComponent, ShapeComponent } from '@plasmastrapi/ecs';
import { IPoint, IShape } from '@plasmastrapi/geometry';
import { HTML5CanvasElement } from '@plasmastrapi/html5-canvas';
import { AccelerationComponent, GravityComponent, PhysicalComponent, VelocityComponent } from '@plasmastrapi/physics';
import { CONSTANTS } from 'app/CONSTANTS';

export default class Ragdoll extends HTML5CanvasElement {
  public constructor({ x, y }: IPoint, a = 0) {
    super();
    this.$add(PoseComponent, { x, y, a });
    // this.$add(ShapeComponent, {
    //   vertices: [
    //     { x: -10, y: -10 },
    //     { x: 10, y: -10 },
    //     { x: 10, y: 10 },
    //     { x: -10, y: 10 },
    //   ],
    // });
    this.$add(ShapeComponent, calculatePolygonVertices(10, 50));
    this.$add(PhysicalComponent, { mass: 1 });
    this.$add(VelocityComponent, { x: 0, y: 0, w: 0 });
    this.$add(AccelerationComponent, { x: 0, y: 0, w: 0 });
    this.$add(GravityComponent, { x: 0, y: CONSTANTS.GRAVITY });
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
