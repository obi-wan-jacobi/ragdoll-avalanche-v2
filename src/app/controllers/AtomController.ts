import { IController } from '@plasmastrapi/html5-canvas';
import { AccelerationComponent } from '@plasmastrapi/physics';
import Atom from 'app/entities/Atom';

const ACCELERATION_FACTOR = 1000;

export default class AtomController implements IController {
  private __atom: Atom;

  public init(): void {
    this.__atom = new Atom({ x: 100, y: 100 });
  }

  public startMovingUp(): void {
    this.__atom.$patch(AccelerationComponent, { y: -ACCELERATION_FACTOR });
  }

  public startMovingDown(): void {
    this.__atom.$patch(AccelerationComponent, { y: ACCELERATION_FACTOR });
  }

  public startMovingLeft(): void {
    this.__atom.$patch(AccelerationComponent, { x: -ACCELERATION_FACTOR });
  }

  public startMovingRight(): void {
    this.__atom.$patch(AccelerationComponent, { x: ACCELERATION_FACTOR });
  }

  public stopMovingUp(): void {
    this.__atom.$patch(AccelerationComponent, { y: 0 });
  }

  public stopMovingDown(): void {
    this.__atom.$patch(AccelerationComponent, { y: 0 });
  }

  public stopMovingLeft(): void {
    this.__atom.$patch(AccelerationComponent, { x: 0 });
  }

  public stopMovingRight(): void {
    this.__atom.$patch(AccelerationComponent, { x: 0 });
  }
}
