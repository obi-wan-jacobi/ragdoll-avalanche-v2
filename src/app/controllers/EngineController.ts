import { IController } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class EngineController implements IController {
  private __isRunning = true;

  public init(): void {}

  public stopOrStart(): void {
    this.__isRunning = !this.__isRunning;
    if (this.__isRunning) {
      app.start();
    } else {
      app.stop();
      console.log('STOP');
    }
  }

  public once(): void {
    if (!this.__isRunning) {
      app.once();
    }
  }
}
