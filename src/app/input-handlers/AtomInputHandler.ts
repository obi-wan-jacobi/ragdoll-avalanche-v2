import { Index } from '@plasmastrapi/base';
import { IKeyboardEvent, InputHandler, KEYBOARD_EVENT, MOUSE_EVENT } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class AtomInputHandler extends InputHandler {
  private __keyDownMap: Index<Function> = {
    ArrowUp: () => app.controllers.atom.startMovingUp(),
    ArrowDown: () => app.controllers.atom.startMovingDown(),
    ArrowLeft: () => app.controllers.atom.startMovingLeft(),
    ArrowRight: () => app.controllers.atom.startMovingRight(),
  };

  private __keyUpMap: Index<Function> = {
    ArrowUp: () => app.controllers.atom.stopMovingUp(),
    ArrowDown: () => app.controllers.atom.stopMovingDown(),
    ArrowLeft: () => app.controllers.atom.stopMovingLeft(),
    ArrowRight: () => app.controllers.atom.stopMovingRight(),
  };

  public init(): void {}

  public dispose(): void {}

  [KEYBOARD_EVENT.KEY_DOWN](event: IKeyboardEvent): void {
    if (this.__keyDownMap[event.key]) {
      this.__keyDownMap[event.key]();
    }
  }

  [KEYBOARD_EVENT.KEY_UP](event: IKeyboardEvent): void {
    if (this.__keyUpMap[event.key]) {
      this.__keyUpMap[event.key]();
    }
  }

  [MOUSE_EVENT.MOUSE_MOVE](event: MouseEvent): void {
    app.controllers.atom.mousemove(event);
  }
}
