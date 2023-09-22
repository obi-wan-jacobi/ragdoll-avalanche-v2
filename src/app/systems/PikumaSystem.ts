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

export default class PikumaSystem extends System {
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
      const nextPose = { x, y, a: prevPose.a };
      const baseAtomShape = atom.$copy(ShapeComponent);
      const prevShape = Shape.transform(baseAtomShape, prevPose);
      highlightEdge(viewport, [prevPose, prevShape.vertices[0]], STYLE_GREEN);
      components.forEvery(LevelComponent)((levelComponent) => {
        const level = levelComponent.$entity;
        if (nextPose.y < 260) {
          return;
        }
        atom.$patch(PoseComponent, { y: 260.01 });
        resolveCollisionWithLevel({ x: nextPose.x, y: 310 }, atom, level);
      });
    });
  }
}

function resolveCollisionWithLevel(pointOfCollision: IPoint, a: IEntity, b: IEntity) {
  // Define coefficient of restitution (elasticity) and friction
  const e = 0.5;
  const f = 0.9;

  // Calculate the relative velocity between the two objects
  const ra: IVector = Vector.expand(Vector.normalizeFromPoints(pointOfCollision, a.$copy(PoseComponent)));

  const { x: vaX, y: vaY, w: vaW } = a.$copy(VelocityComponent);
  const va: IVector = {
    x: vaX + vaW * ra.y,
    y: vaY - vaW * ra.x,
  };

  const vrel: IVector = {
    x: va.x,
    y: va.y,
  };

  // Now we proceed to calculate the collision impulse along the normal
  const normal = { x: 0, y: 1 }; // not sure about this...
  const vrelDotNormal = Vector.dotProduct(Vector.normalize(vrel), Vector.normalize(normal));
  const impulseDirectionN = normal;
  const invMassA = 1;
  const invIA = 1 / (0.5 * 50 * 50);
  const impulseMagnitudeN =
    (-(1 + e) * vrelDotNormal) /
    (invMassA +
      Vector.crossProduct(Vector.normalize(ra), Vector.normalize(normal)) *
        Vector.crossProduct(Vector.normalize(ra), Vector.normalize(normal)) *
        invIA);
  const jN: IVector = Vector.expand(Vector.multiply(Vector.normalize(impulseDirectionN), impulseMagnitudeN));
  // Now we proceed to calculate the collision impulse along the tangent
  // const tangent: IVector = Vector.expand(Vector.perpendicular(Vector.normalize(normal)));
  const tangent: IVector = { x: 1, y: 0 };
  const vrelDotTangent = Vector.dotProduct(Vector.normalize(vrel), Vector.normalize(tangent));
  const impulseDirectionT: IVector = tangent;
  const impulseMagnitudeT =
    (f * -(1 + e) * vrelDotTangent) /
    (invMassA +
      Vector.crossProduct(Vector.normalize(ra), Vector.normalize(tangent)) *
        Vector.crossProduct(Vector.normalize(ra), Vector.normalize(tangent)) *
        invIA);
  const jT: IVector = Vector.expand(Vector.multiply(Vector.normalize(impulseDirectionT), impulseMagnitudeT));

  // Calculate the final impulse j combining normal and tangent impulses
  const j = {
    x: jN.x + jT.x,
    y: jN.y + jT.y,
  };

  // Apply the impulse vector to both objects in opposite direction
  // a->ApplyImpulse(j, ra);
  // b->ApplyImpulse(-j, rb);
  const jNormalized = Vector.normalize(j);

  const impulsesA = a.$copy(ImpulsesComponent).values;
  const impulseA = Object.assign(jNormalized, {
    origin: { x: pointOfCollision.x, y: pointOfCollision.y },
  });
  a.$patch(ImpulsesComponent, { values: [...impulsesA, impulseA] });
}

function resolveCollision(pointOfCollision: IPoint, a: IEntity, b: IEntity) {
  // Define coefficient of restitution (elasticity) and friction
  const e = 0.5;
  const f = 0.5;

  // Calculate the relative velocity between the two objects
  const ra: IVector = Vector.expand(Vector.normalizeFromPoints(pointOfCollision, a.$copy(PoseComponent)));
  const rb: IVector = Vector.expand(Vector.normalizeFromPoints(pointOfCollision, b.$copy(PoseComponent)));

  const { x: vaX, y: vaY, w: vaW } = a.$copy(VelocityComponent);
  const va: IVector = {
    x: vaX - vaW * ra.y,
    y: vaY + vaW * ra.x,
  };
  const { x: vbX, y: vbY, w: vbW } = b.$copy(VelocityComponent);
  const vb: IVector = {
    x: vbX - vbW * rb.y,
    y: vbY + vbW * rb.x,
  };

  const vrel: IVector = {
    x: va.x - vb.x,
    y: va.y - vb.y,
  };

  // Now we proceed to calculate the collision impulse along the normal
  const normal = { x: 0, y: 1 }; // not sure about this...
  const vrelDotNormal = Vector.dotProduct(Vector.normalize(vrel), Vector.normalize(normal));
  const impulseDirectionN = normal;
  const invMassA = 1;
  const invIA = 1000;
  const invMassB = 0;
  const invIB = 0;
  const impulseMagnitudeN =
    (-(1 + e) * vrelDotNormal) /
    (invMassA +
      invMassB +
      Vector.crossProduct(Vector.normalize(ra), Vector.normalize(normal)) *
        Vector.crossProduct(Vector.normalize(ra), Vector.normalize(normal)) *
        invIA +
      Vector.crossProduct(Vector.normalize(rb), Vector.normalize(normal)) *
        Vector.crossProduct(Vector.normalize(rb), Vector.normalize(normal)) *
        invIB);
  const jN: IVector = Vector.expand(Vector.multiply(Vector.normalize(impulseDirectionN), impulseMagnitudeN));

  // Now we proceed to calculate the collision impulse along the tangent
  const tangent: IVector = Vector.expand(Vector.perpendicular(Vector.normalize(normal)));
  const vrelDotTangent = Vector.dotProduct(Vector.normalize(vrel), Vector.normalize(tangent));
  const impulseDirectionT: IVector = tangent;
  const impulseMagnitudeT =
    (f * -(1 + e) * vrelDotTangent) /
    (invMassA +
      invMassB +
      Vector.crossProduct(Vector.normalize(ra), Vector.normalize(tangent)) *
        Vector.crossProduct(Vector.normalize(ra), Vector.normalize(tangent)) *
        invIA +
      Vector.crossProduct(Vector.normalize(rb), Vector.normalize(tangent)) *
        Vector.crossProduct(Vector.normalize(rb), Vector.normalize(tangent)) *
        invIB);
  const jT: IVector = Vector.expand(Vector.multiply(Vector.normalize(impulseDirectionT), impulseMagnitudeT));

  // Calculate the final impulse j combining normal and tangent impulses
  const j = {
    x: jN.x + jT.x,
    y: jN.y + jT.y,
  };

  // Apply the impulse vector to both objects in opposite direction
  // a->ApplyImpulse(j, ra);
  // b->ApplyImpulse(-j, rb);
  const jNormalized = Vector.normalize(j);

  const impulsesA = a.$copy(ImpulsesComponent).values;
  const impulseA = Object.assign(jNormalized, { origin: pointOfCollision });
  a.$patch(ImpulsesComponent, { values: [...impulsesA, impulseA] });

  const impulsesB = a.$copy(ImpulsesComponent).values;
  const impulseB = Object.assign(jNormalized, { origin: pointOfCollision });
  b.$patch(ImpulsesComponent, { values: [...impulsesB, impulseB] });
}

function isCollidingPolygonPolygon(a: IEntity, b: IEntity): any | undefined {
  const aShape = Shape.transform(a.$copy(ShapeComponent), a.$copy(PoseComponent));
  const bShape = Shape.transform(b.$copy(ShapeComponent), b.$copy(PoseComponent));
  const { separation: abSeparation, axis: aAxis, point: aPoint } = findMinSeparation(aShape, bShape);
  if (abSeparation >= 0) {
    return undefined;
  }
  const { separation: baSeparation, axis: bAxis, point: bPoint } = findMinSeparation(bShape, aShape);
  if (baSeparation >= 0) {
    return undefined;
  }
  const result: any = { a, b };
  if (abSeparation > baSeparation) {
    result.depth = -abSeparation;
    result.normal = Vector.perpendicular(Vector.normalize(aAxis));
    result.start = aPoint;
    const vEnd = Vector.multiply(result.normal, result.depth);
    result.end = {
      x: aPoint.x + vEnd.direction.x * vEnd.magnitude,
      y: aPoint.y + vEnd.direction.y * vEnd.magnitude,
    };
  } else {
    result.depth = -baSeparation;
    result.normal = Vector.multiply(Vector.perpendicular(Vector.normalize(bAxis)), -1);
    const vStart = Vector.multiply(Vector.multiply(result.normal, result.depth), -1);
    result.start = {
      x: bPoint.x - vStart.direction.x * vStart.magnitude,
      y: bPoint.y - vStart.direction.y * vStart.magnitude,
    };
    result.end = bPoint;
  }
  return result;
}

function findMinSeparation(aShape: IShape, bShape: IShape): { separation: number; axis: IVector; point: IPoint } {
  let separation = Number.NEGATIVE_INFINITY;
  let axis: IVector = { x: 0, y: 0 };
  let point: IPoint = { x: 0, y: 0 };
  // Loop all the vertices of "this" polygon
  for (let i = 0; i < aShape.vertices.length; i++) {
    const va = aShape.vertices[i];
    const normal = normalAt(aShape, i);
    // Loop all the vertices of the "other" polygon
    let minSep = Number.MAX_VALUE;
    let minVertex: IPoint = { x: 0, y: 0 };
    for (let j = 0; j < bShape.vertices.length; j++) {
      const vb = bShape.vertices[j];
      const v = Vector.normalizeFromPoints(va, vb);
      const proj = Vector.dotProduct(v, normal);
      if (proj < minSep) {
        minSep = proj;
        minVertex = vb;
      }
    }
    if (minSep > separation) {
      separation = minSep;
      axis = edgeAt(aShape, i);
      point = minVertex;
    }
  }
  return {
    separation,
    axis,
    point,
  };
}

function edgeAt(shape: IShape, index: number): IVector {
  const currVertex = index;
  const nextVertex = (index + 1) % shape.vertices.length;
  return Vector.expand(Vector.normalizeFromPoints(shape.vertices[currVertex], shape.vertices[nextVertex]));
}

function normalAt(shape: IShape, index: number): INormalizedVector {
  const currVertex = index;
  const nextVertex = (index + 1) % shape.vertices.length;
  const v = Vector.normalizeFromPoints(shape.vertices[currVertex], shape.vertices[nextVertex]);
  return Vector.perpendicular(v);
}
