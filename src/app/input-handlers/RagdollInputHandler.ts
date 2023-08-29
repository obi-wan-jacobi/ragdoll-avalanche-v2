import { Index } from '@plasmastrapi/base';
import { IKeyboardEvent, InputHandler, KEYBOARD_EVENT } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class RagdollInputHandler extends InputHandler {
  private __keyDownMap: Index<Function> = {
    ArrowUp: () => app.controllers.ragdoll.startMovingUp(),
    ArrowDown: () => app.controllers.ragdoll.startMovingDown(),
    ArrowLeft: () => app.controllers.ragdoll.startMovingLeft(),
    ArrowRight: () => app.controllers.ragdoll.startMovingRight(),
  };

  private __keyUpMap: Index<Function> = {
    ArrowUp: () => app.controllers.ragdoll.stopMovingUp(),
    ArrowDown: () => app.controllers.ragdoll.stopMovingDown(),
    ArrowLeft: () => app.controllers.ragdoll.stopMovingLeft(),
    ArrowRight: () => app.controllers.ragdoll.stopMovingRight(),
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
}
