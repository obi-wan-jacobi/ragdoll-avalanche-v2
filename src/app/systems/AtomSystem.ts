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
    delta,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    delta: number;
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
      // draw stripe
      highlightEdge(viewport, [prevPose, prevShape.vertices[0]], STYLE_GREEN);
      components.forEvery(LevelComponent)((levelComponent) => {
        // 1. find "deepest" intersection with level, then push out in opposite direction of motion
        const level = levelComponent.$entity;
        const levelShape = Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent));
        const levelEdges = Shape.toEdges(levelShape);
        let longestIntersection = getLongestIntersectionWithLevel(nextShape, prevShape, levelEdges);
        let pointOfCollision: IPoint | undefined;
        if (!longestIntersection) {
          return;
        }
        pointOfCollision = longestIntersection.point;
        const resolvedPose = {
          x: nextPose.x - u.direction.x * (longestIntersection!.distance + 0.1),
          y: nextPose.y - u.direction.y * (longestIntersection!.distance + 0.1),
          a: nextPose.a,
        };
        // 2. if resolved pose still intersects, push out along level normal
        longestIntersection = getLongestIntersectionWithLevel(
          Shape.transform(baseAtomShape, resolvedPose),
          prevShape,
          levelEdges,
        );
        if (!!longestIntersection) {
          pointOfCollision = longestIntersection.point;
          const levelNormal = getLevelCollisionNormal(
            Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent)),
            longestIntersection!.point,
          );
          const motionVector = Vector.normalizeFromPoints(prevPose, nextPose);
          const pushOutVector = Vector.projectAOntoB(motionVector, levelNormal);
          resolvedPose.x -= pushOutVector.direction.x * (pushOutVector.magnitude + 0.1);
          resolvedPose.y -= pushOutVector.direction.y * (pushOutVector.magnitude + 0.1);
          console.log('use level normal');
        }
        // 3. if resolved pose still intersects, reset to previous pose
        longestIntersection = getLongestIntersectionWithLevel(
          Shape.transform(baseAtomShape, resolvedPose),
          prevShape,
          levelEdges,
        );
        if (!!longestIntersection) {
          pointOfCollision = longestIntersection.point;
          resolvedPose.x = prevPose.x;
          resolvedPose.y = prevPose.y;
          resolvedPose.a = prevPose.a;
          console.log('reset');
        }
        atom.$patch(PoseComponent, resolvedPose);
        // 4. determine resultant velocity after collision
        const velocity = levelGetResultantVelocityAfterCollision({
          entity: atom,
          level: levelComponent.$entity,
          pointOfCollision,
          cFriction: 0.95,
          cRestitution: 0,
          dt: delta,
          viewport,
        });
        atom.$patch(VelocityComponent, { x: velocity.x, y: velocity.y, w: velocity.w });
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
  dt,
  viewport,
}: {
  entity: IEntity;
  level: IEntity;
  pointOfCollision: IPoint;
  cFriction: number;
  cRestitution: number;
  dt: number;
  viewport: IViewport<any>;
}): IVelocity {
  // 1. calculate new linear velocity due to linear motion of collision (v = cF*w + cR*u)
  const velocity = entity.$copy(VelocityComponent);
  const { linearVelocity, n } = getResultantLinearVelocityAfterCollisionWithLevel(
    entity,
    level,
    pointOfCollision,
    cRestitution,
    cFriction,
  );
  // 2. calculate new angular velocity after frictional impulse
  const { lateralDirectionVector, r, frictionalImpulse, newAngularVelocity } =
    getResultantAngularVelocityAfterFrictionalImpulse(
      entity,
      pointOfCollision,
      linearVelocity,
      n,
      velocity,
      cFriction,
      dt,
    );
  // 3. calculate angular velocity effect on linear velocity
  const nextLinearVelocity: IVector = getResultantLinearVelocityDueToAngularVelocity(
    linearVelocity,
    lateralDirectionVector,
    r,
    velocity,
    frictionalImpulse,
  );
  // put it all together
  return {
    x: nextLinearVelocity.x,
    y: nextLinearVelocity.y,
    w: newAngularVelocity,
  };
}

function getResultantLinearVelocityDueToAngularVelocity(
  linearVelocity: INormalizedVector,
  lateralDirectionVector: INormalizedVector,
  r: INormalizedVector,
  velocity: IVelocity,
  frictionalImpulse: number,
) {
  const currentLateralVelocity = Vector.projectAOntoB(linearVelocity, lateralDirectionVector);
  const relativeLateralVelocityDueToAngularVelocity = Vector.multiply(lateralDirectionVector, r.magnitude * velocity.w);
  const nextLinearVelocity: IVector = Vector.expand(linearVelocity);
  if (currentLateralVelocity.magnitude <= relativeLateralVelocityDueToAngularVelocity.magnitude) {
    nextLinearVelocity.x +=
      lateralDirectionVector.direction.x *
      (relativeLateralVelocityDueToAngularVelocity.magnitude - currentLateralVelocity.magnitude);
    nextLinearVelocity.y +=
      lateralDirectionVector.direction.y *
      (relativeLateralVelocityDueToAngularVelocity.magnitude - currentLateralVelocity.magnitude);
  }
  // nextLinearVelocity.x -= lateralDirectionVector.direction.x * frictionalImpulse;
  // nextLinearVelocity.y -= lateralDirectionVector.direction.y * frictionalImpulse;
  return nextLinearVelocity;
}

function getResultantAngularVelocityAfterFrictionalImpulse(
  entity: IEntity,
  pointOfCollision: IPoint,
  linearVelocity: INormalizedVector,
  n: INormalizedVector,
  velocity: IVelocity,
  cFriction: number,
  dt: number,
) {
  const pose = entity.$copy(PoseComponent);
  const centerOfMass = pose;
  const r = Vector.normalizeFromPoints(centerOfMass, pointOfCollision);
  const { mass } = entity.$copy(PhysicalComponent);
  const lateralDirectionVector = getLateralDirectionVectorRelativeToLevel(
    n,
    centerOfMass,
    pointOfCollision,
    Math.sign(velocity.w),
  );
  const signDueToLinearVelocity = Math.sign(Vector.crossProduct(linearVelocity, lateralDirectionVector));
  const dueToLinearVelocity =
    (signDueToLinearVelocity * Vector.projectAOntoB(linearVelocity, lateralDirectionVector).magnitude) / r.magnitude;
  const angularVelocity = getMaxByMagnitude(velocity.w, dueToLinearVelocity);
  const signOfAngularVelocity = Math.sign(angularVelocity);
  const k = 1 / 10;
  const frictionalImpulse = getFrictionalImpulse(cFriction, k, mass, dt);
  const newAngularVelocity = clamp(angularVelocity - signOfAngularVelocity * frictionalImpulse, signOfAngularVelocity);
  return { lateralDirectionVector, r, frictionalImpulse, newAngularVelocity };
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

function getMaxByMagnitude(a: number, b: number): number {
  if (Math.abs(a) > Math.abs(b)) {
    return a;
  }
  return b;
}

function getFrictionalImpulse(cFriction: number, k: number, mass: number, dt: number) {
  return ((1 - cFriction) * k * mass * CONSTANTS.GRAVITY * dt) / 1000;
}

function getResultantLinearVelocityAfterCollisionWithLevel(
  entity: IEntity,
  level: IEntity,
  pointOfCollision: IPoint,
  cRestitution: number,
  cFriction: number,
) {
  const v = Vector.normalize(entity.$copy(VelocityComponent));
  const n = getLevelCollisionNormal(
    Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent)),
    pointOfCollision,
  );
  const u = Vector.reverse(Vector.projectAOntoB(v, n));
  const w = Vector.add(u, v);
  const linearVelocity = Vector.add(Vector.multiply(u, cRestitution), Vector.multiply(w, cFriction));
  return { linearVelocity, n };
}

function clamp(value: number, sign: number): number {
  if (value < 0 && sign > 0) {
    return 0;
  }
  if (value > 0 && sign < 0) {
    return 0;
  }
  return value;
}
