import { Index } from '@plasmastrapi/base';
import { IKeyboardEvent, InputHandler, KEYBOARD_EVENT } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class EngineInputHandler extends InputHandler {
  private __keyUpMap: Index<Function> = {
    ' ': () => app.controllers.engine.stopOrStart(),
    ArrowRight: () => app.controllers.engine.once(),
  };

  public init(): void {}

  public dispose(): void {}

  [KEYBOARD_EVENT.KEY_UP](event: IKeyboardEvent): void {
    if (this.__keyUpMap[event.key]) {
      this.__keyUpMap[event.key]();
    }
  }
}
