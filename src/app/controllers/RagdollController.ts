import { IController } from '@plasmastrapi/html5-canvas';
import { AccelerationComponent, VelocityComponent } from '@plasmastrapi/physics';
import Ragdoll from 'app/entities/Ragdoll';

const ACCELERATION_FACTOR = 1000;

export default class RagdollController implements IController {
  private __ragdoll: Ragdoll;

  public init(): void {
    // this.__ragdoll = new Ragdoll({ x: 100, y: 200 });
    // this.__ragdoll.$patch(VelocityComponent, { w: 0 });
  }

  public startMovingUp(): void {
    this.__ragdoll.$patch(AccelerationComponent, { y: -ACCELERATION_FACTOR });
  }

  public startMovingDown(): void {
    this.__ragdoll.$patch(AccelerationComponent, { y: ACCELERATION_FACTOR });
  }

  public startMovingLeft(): void {
    this.__ragdoll.$patch(AccelerationComponent, { x: -ACCELERATION_FACTOR });
  }

  public startMovingRight(): void {
    this.__ragdoll.$patch(AccelerationComponent, { x: ACCELERATION_FACTOR });
  }

  public stopMovingUp(): void {
    this.__ragdoll.$patch(AccelerationComponent, { y: 0 });
  }

  public stopMovingDown(): void {
    this.__ragdoll.$patch(AccelerationComponent, { y: 0 });
  }

  public stopMovingLeft(): void {
    this.__ragdoll.$patch(AccelerationComponent, { x: 0 });
  }

  public stopMovingRight(): void {
    this.__ragdoll.$patch(AccelerationComponent, { x: 0 });
  }
}
