/* eslint-disable no-extra-boolean-cast */
import { clone } from '@plasmastrapi/base';
import { IComponentMaster, IEntity, IEntityMaster, PoseComponent, ShapeComponent, System } from '@plasmastrapi/ecs';
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
  Epsilon,
} from '@plasmastrapi/geometry';
import { IVelocity, LevelComponent, PhysicalComponent, VelocityComponent } from '@plasmastrapi/physics';
import { IViewport } from '@plasmastrapi/viewport';
import { CONSTANTS } from 'app/CONSTANTS';
import ImpulsesComponent from 'app/components/ImpulsesComponent';
import Atom from 'app/entities/Atom';
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

export default class AtomSystem extends System {
  public once({
    entities,
    components,
    deltaTime,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    deltaTime: number;
    viewport: IViewport<any>;
  }): void {
    entities.forEvery(Atom)((atom) => {
      const { x, y, a, $ } = atom.$copy(PoseComponent);
      const prevPose = $!.previous;
      const nextPose = { x, y, a };
      const baseAtomShape = atom.$copy(ShapeComponent);
      const prevShape = Shape.transform(baseAtomShape, prevPose);
      const nextShape = Shape.transform(baseAtomShape, nextPose);
      const u = Vector.normalizeFromPoints(prevPose, nextPose);
      highlightEdge(viewport, [prevPose, prevShape.vertices[0]], STYLE_GREEN);
      components.forEvery(LevelComponent)((levelComponent) => {
        const level = levelComponent.$entity;
        const levelShape = Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent));
        const levelEdges = Shape.toEdges(levelShape);
        // find "deepest" intersection with level, then push out in opposite direction of motion
        const longestIntersection = getLongestIntersectionWithLevel(nextShape, prevShape, levelEdges);
        if (!longestIntersection) {
          return;
        }
        // const pointOfCollision = longestIntersection.point;
        // viewport.drawCircle({ position: pointOfCollision, radius: 5, style: STYLE_YELLOW });
        const resolvedPose = {
          x: nextPose.x - u.direction.x * (longestIntersection!.distance + 0.1),
          y: nextPose.y - u.direction.y * (longestIntersection!.distance + 0.1),
          a: prevPose.a,
        };
        const resolvedShape = Shape.transform(baseAtomShape, resolvedPose);
        viewport.drawShape({ path: resolvedShape.vertices, style: STYLE_RED });
        atom.$patch(PoseComponent, resolvedPose);
        // 4. determine resultant velocity after collision
        // const velocity = levelGetResultantVelocityAfterCollision({
        //   entity: atom,
        //   level: levelComponent.$entity,
        //   pointOfCollision,
        //   cFriction: 0.2,
        //   cRestitution: 0.2,
        // });
        // atom.$patch(VelocityComponent, { x: velocity.x, y: velocity.y, w: velocity.w });

        // const impulse =
        // const impulses = atom.$copy(ImpulsesComponent);
        // impulses.values.push({  })
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
  // 1. calculate new linear velocity due to linear motion of collision (v = cF*w + cR*u)
  const velocity = entity.$copy(VelocityComponent);
  const v = Vector.normalize(entity.$copy(VelocityComponent));
  const n = getLevelCollisionNormal(
    Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent)),
    pointOfCollision,
  );
  const u = Vector.reverse(Vector.projectAOntoB(v, n));
  const w = Vector.add(u, v);
  const linearVelocity = Vector.expand(Vector.add(Vector.multiply(u, cRestitution), Vector.multiply(w, cFriction)));
  return {
    x: linearVelocity.x,
    y: linearVelocity.y,
    w: velocity.w,
  };
}

function getLateralDirectionVectorRelativeToLevel(
  n: INormalizedVector,
  centerOfMass: IPoint,
  pointOfCollision: IPoint,
  signOfAngularVelocity: number,
) {
  const lateralDirectionVector = Vector.perpendicular(n);
  const p = {
    x: centerOfMass.x + centerOfMass.x * lateralDirectionVector.direction.x * lateralDirectionVector.magnitude,
    y: centerOfMass.y + centerOfMass.y * lateralDirectionVector.direction.y * lateralDirectionVector.magnitude,
  };
  if (Vector.orientation(p, centerOfMass, pointOfCollision) > 0 && signOfAngularVelocity < 0) {
    return Vector.reverse(lateralDirectionVector);
  }
  if (Vector.orientation(p, centerOfMass, pointOfCollision) < 0 && signOfAngularVelocity > 0) {
    return Vector.reverse(lateralDirectionVector);
  }
  return lateralDirectionVector;
}
