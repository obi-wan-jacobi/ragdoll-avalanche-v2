import { Rectangle, Shape, GeoJSON, intersect } from '@plasmastrapi/geometry';
import { extrude } from 'app/extrude';

describe('something strange', () => {
  fit('based on shape', () => {
    const levelShape = Shape.transform(Rectangle.create(1280, 100), { x: 1280 / 2, y: 720 / 2, a: 0 });
    const levelGeos = GeoJSON.createFromShape(levelShape);
    const baseRagdollShape = {
      vertices: [
        { x: 50, y: 0 },
        { x: -24.99999999999999, y: 43.30127018922194 },
        { x: -25.00000000000002, y: -43.30127018922192 },
      ],
    };
    const prevPose = { x: 100, y: 267.4942298107779, a: 0.10250000000000006 };
    const nextPose = { x: 100, y: 271.6062298107779, a: 0.10250000000000006 };
    const prevShape = Shape.transform(baseRagdollShape, prevPose);
    const nextShape = Shape.transform(baseRagdollShape, nextPose);
    const extrusion = extrude(baseRagdollShape, prevPose, nextPose, 0.000001);
    const intersection = intersect(GeoJSON.createFromShape(extrusion), levelGeos);
    expect(intersection).toBeTruthy();
  });

  it('based on extrusion', () => {
    const levelShape = Shape.transform(Rectangle.create(1280, 100), { x: 1280 / 2, y: 720 / 2, a: 0 });
    const levelGeos = GeoJSON.createFromShape(levelShape);
    const extrusion = {
      vertices: [
        { x: 71.54056531386851, y: 225.08838345677836 },
        { x: 149.8323166607743, y: 262.1073099813861 },
        { x: 149.83232164400647, y: 262.23530957224403 },
        { x: 78.62711304212502, y: 311.52849640331175 },
      ],
    };
    console.log(extrusion);
    const intersection = intersect(GeoJSON.createFromShape(extrusion), levelGeos);
    expect(intersection).toBeTruthy();
  });
});
