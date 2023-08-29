import { PoseComponent } from '@plasmastrapi/ecs';
import { IController, IMouseEvent } from '@plasmastrapi/html5-canvas';
import Handle from 'app/entities/Handle';

export default class HandleController implements IController {
  private __handle: Handle;

  public init(): void {
    this.__handle = new Handle({ x: 0, y: 0 });
  }

  public mousemove(event: IMouseEvent): void {
    this.__handle.$patch(PoseComponent, { x: event.x, y: event.y });
  }
}
