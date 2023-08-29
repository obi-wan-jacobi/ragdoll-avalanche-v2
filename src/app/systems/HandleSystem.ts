import { IComponentMaster, IEntityMaster, PoseComponent, ShapeComponent, System } from '@plasmastrapi/ecs';
import { COLOUR } from '@plasmastrapi/engine';
import { Edge, IPoint, IShape, Shape } from '@plasmastrapi/geometry';
import { IViewport } from '@plasmastrapi/viewport';
import Handle from 'app/entities/Handle';
import { extrude, highlightEdge } from 'app/extrude';

const STYLE_GREEN = { colour: 'lightgreen', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_GREEN_BIG = { colour: 'lightgreen', fill: 'lightgreen', opacity: 1, zIndex: 9999 };
const STYLE_RED = { colour: 'red', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_RED_BIG = { colour: 'red', fill: 'red', opacity: 1, zIndex: 9999 };
const STYLE_YELLOW = { colour: 'yellow', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_BLUE = { colour: 'blue', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_WHITE = { colour: 'white', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_PINK = { colour: 'pink', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_ORANGE = { colour: 'orange', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };

export default class HandleSystem extends System {
  public once({
    entities,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    delta: number;
    viewport: IViewport<any>;
  }): void {
    entities.forEvery(Handle)((handle) => {
      // const prevPose = { x: 100, y: 100, a: 0 };
      const nextPose = handle.$copy(PoseComponent);
      // // const nextPose = { x: 201, y: 150, a: -0.5 };
      // const extrusion = extrude(handle.$copy(ShapeComponent), prevPose, nextPose, 0.000001);
      const baseRagdollShape = {
        vertices: [
          { x: 50, y: 0 },
          { x: -24.99999999999999, y: 43.30127018922194 },
          { x: -25.00000000000002, y: -43.30127018922192 },
        ],
      };
      const prevPose = { x: 100, y: 300, a: 0 };
      // const nextPose = { x: 300, y: 355, a: 0 };
      const extrusion = extrude(baseRagdollShape, prevPose, nextPose, 0.000001, viewport);
      // viewport.drawShape({ path: extrusion.vertices, style: STYLE_WHITE });
    });
  }
}
