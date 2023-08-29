import { PoseComponent, ShapeComponent } from '@plasmastrapi/ecs';
import { Rectangle } from '@plasmastrapi/geometry';
import { HTML5CanvasElement, IController } from '@plasmastrapi/html5-canvas';
import { LevelComponent } from '@plasmastrapi/physics';
import { app } from 'app/main';

export default class LevelController implements IController {
  public init(): void {
    new HTML5CanvasElement()
      .$add(LevelComponent, {})
      .$add(PoseComponent, { x: app.viewport.width / 2, y: app.viewport.height / 2, a: 0 })
      .$add(ShapeComponent, Rectangle.create(app.viewport.width, 100));
    // .$add(ShapeComponent, {
    //   vertices: [
    //     { x: -app.viewport.width / 2, y: -200 },
    //     { x: 0, y: -10 },
    //     { x: app.viewport.width / 2, y: -10 },
    //     { x: app.viewport.width / 2, y: 10 },
    //     { x: -app.viewport.width / 2, y: 10 },
    //   ],
    // });
    // .$add(ShapeComponent, {
    //   vertices: [
    //     { x: -app.viewport.width / 2, y: -app.viewport.height / 2 },
    //     { x: -app.viewport.width / 2 + 10, y: -app.viewport.height / 2 },
    //     { x: -app.viewport.width / 2 + 10, y: -10 },
    //     { x: app.viewport.width / 2 - 10, y: -10 },
    //     { x: app.viewport.width / 2 - 10, y: -app.viewport.height / 2 },
    //     { x: app.viewport.width / 2, y: -app.viewport.height / 2 },
    //     { x: app.viewport.width / 2, y: 10 },
    //     { x: -app.viewport.width / 2, y: 10 },
    //   ],
    // });
  }
}
