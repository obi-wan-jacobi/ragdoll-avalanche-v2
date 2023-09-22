import {
  Entity,
  IComponentMaster,
  IEntity,
  IEntityMaster,
  PoseComponent,
  ShapeComponent,
  System,
} from '@plasmastrapi/ecs';
import { COLOUR } from '@plasmastrapi/engine';
import {
  GBOX,
  Vector,
  GeoJSON,
  Point,
  IEdgesIntersection,
  intersect,
  IPoint,
  booleanPointOnLine,
  INormalizedVector,
  IVector,
  Edge,
  IShape,
  Shape,
  IPose,
} from '@plasmastrapi/geometry';
import { IVelocity, LevelComponent, PhysicalComponent, VelocityComponent } from '@plasmastrapi/physics';
import { IViewport } from '@plasmastrapi/viewport';
import Ragdoll from 'app/entities/Ragdoll';
import { highlightEdge, highlightPoint } from 'app/extrude';
import { getLevelCollisionNormal, getLongestIntersectionWithLevel } from 'app/utils';

const STYLE_GREEN = { colour: 'lightgreen', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_GREEN_BIG = { colour: 'lightgreen', fill: 'lightgreen', opacity: 1, zIndex: 9999 };
const STYLE_RED = { colour: 'red', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_RED_BIG = { colour: 'red', fill: 'red', opacity: 1, zIndex: 9999 };
const STYLE_YELLOW = { colour: 'yellow', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_BLUE = { colour: 'blue', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_WHITE = { colour: 'white', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_PINK = { colour: 'pink', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_ORANGE = { colour: 'orange', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };

export default class CollisionSystem extends System {
  public once({
    entities,
    components,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    deltaTime: number;
    viewport: IViewport<any>;
  }): void {
    entities.forEvery(Entity)((entity) => {
      if (!entity.$has(VelocityComponent)) {
        return;
      }
      const { x, y, a, $ } = entity.$copy(PoseComponent);
      const prevPose = $!.previous;
      const nextPose = { x, y, a };
      const baseAtomShape = entity.$copy(ShapeComponent);
      const prevShape = Shape.transform(baseAtomShape, prevPose);
      const nextShape = Shape.transform(baseAtomShape, nextPose);
      components.forEvery(LevelComponent)((levelComponent) => {
        const level = levelComponent.$entity;
        const levelShape = Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent));
        const levelEdges = Shape.toEdges(levelShape);
        const longestIntersection = getLongestIntersectionWithLevel(nextShape, prevShape, levelEdges);
        if (!longestIntersection) {
          return;
        }
        const levelNormal = getLevelCollisionNormal(
          Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent)),
          longestIntersection!.point,
        );
        viewport.drawCircle({ position: longestIntersection.point, radius: 5, style: STYLE_YELLOW });
        viewport.drawLine({
          path: [
            longestIntersection.point,
            {
              x: longestIntersection.point.x + levelNormal.direction.x * 50,
              y: longestIntersection.point.y + levelNormal.direction.y * 50,
            },
          ],
          style: STYLE_YELLOW,
        });
      });
    });
  }
}

function levelGetResultantVelocityAfterCollision({
  entity,
  level,
  pointOfCollision,
  cFriction,
  cRestitution,
}: {
  entity: IEntity;
  level: IEntity;
  pointOfCollision: IPoint;
  cFriction: number;
  cRestitution: number;
}): IVelocity {
  const velocity = entity.$copy(VelocityComponent);
  const v = Vector.normalize(velocity);
  const n = getLevelCollisionNormal(
    Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent)),
    pointOfCollision,
  );
  const u = Vector.projectAOntoB(v, n);
  const w = Vector.subtractAfromB(u, v);
  // v = cF*w - cR*u
  const linearVelocity = Vector.expand(
    Vector.subtractAfromB(Vector.multiply(u, cRestitution), Vector.multiply(w, cFriction)),
  );
  // calculate angular velocity
  const pose = entity.$copy(PoseComponent);
  const shape = Shape.transform(entity.$copy(ShapeComponent), pose);
  const centerOfMass = pose;
  const { mass } = entity.$copy(PhysicalComponent);
  const radius = 50;
  const momentOfInertia = radius ** 2;
  const p = Vector.multiply(v, mass);
  const r = Vector.normalizeFromPoints(centerOfMass, pointOfCollision);
  const L = Vector.crossProduct(r, p);
  const angularVelocity = -L / momentOfInertia + velocity.w * 0.1;
  // calculate angular velocity affect on linear velocity
  return { x: linearVelocity.x, y: linearVelocity.y, w: angularVelocity };
}
