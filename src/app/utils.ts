import {
  IPoint,
  IShape,
  booleanPointOnLine,
  GeoJSON,
  Vector,
  Edge,
  INormalizedVector,
  IEdgesIntersection,
  Shape,
} from '@plasmastrapi/geometry';
import { CONSTANTS } from './CONSTANTS';

export function getLevelCollisionNormal(level: IShape, pointOfCollision: IPoint): INormalizedVector {
  const vertices = level.vertices;
  vertices.unshift(vertices[vertices.length - 1]);
  const intersectingEdges: Edge[] = [];
  for (let i = 0, L = vertices.length; i < L - 1; i++) {
    const v1 = vertices[i];
    const v2 = vertices[i + 1];
    const edge = GeoJSON.createFromPoints([v1, v2]);
    const { x, y } = pointOfCollision;
    if (booleanPointOnLine([x, y], edge, { epsilon: 0.1 })) {
      intersectingEdges.push([v1, v2]);
    }
  }
  if (intersectingEdges.length === 0) {
    throw new Error(`Point (${pointOfCollision.x}, ${pointOfCollision.y}) does not lie on any edges in given shape.`);
  }
  if (intersectingEdges.length === 1) {
    const edge = intersectingEdges[0];
    const v = Vector.normalizeFromPoints(edge[0], edge[1]);
    return { direction: { x: -v.direction.y, y: v.direction.x }, magnitude: 1 };
  }
  const edge1 = intersectingEdges[0];
  const edge2 = intersectingEdges[1];
  const v1 = Vector.normalizeFromPoints(edge1[0], edge1[1]);
  const v2 = Vector.normalizeFromPoints(edge2[0], edge2[1]);
  const vTotal = Vector.add(v1, v2);
  return {
    direction: {
      x: -vTotal.direction.y,
      y: vTotal.direction.x,
    },
    magnitude: 1,
  };
}

export function getLongestIntersectionWithLevel(
  nextShape: IShape,
  prevShape: IShape,
  levelEdges: Edge[],
): IEdgesIntersection | undefined {
  let longestIntersection: IEdgesIntersection | undefined = undefined;
  for (let i = 0, L = nextShape.vertices.length; i < L; i++) {
    const startpoint = nextShape.vertices[i];
    const endpoint = prevShape.vertices[i];
    const intersections = Shape.findAllEdgeIntersections(startpoint, endpoint, levelEdges, {
      isIncludeStart: true,
      isIncludeEnd: true,
    });
    while (intersections.length) {
      const intersection = intersections.pop()!;
      if (longestIntersection && Math.abs(longestIntersection.distance - intersection.distance) <= CONSTANTS.EPSILON) {
        longestIntersection.point.x = (longestIntersection.point.x + intersection.point.x) / 2;
        longestIntersection.point.y = (longestIntersection.point.y + intersection.point.y) / 2;
        continue;
      }
      if (!longestIntersection || longestIntersection.distance < intersection.distance) {
        longestIntersection = intersection;
      }
    }
  }
  return longestIntersection;
}
