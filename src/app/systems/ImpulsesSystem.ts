import { IComponentMaster, IEntityMaster, ISystemMaster, PoseComponent, System } from '@plasmastrapi/ecs';
import { Vector } from '@plasmastrapi/geometry';
import { VelocityComponent } from '@plasmastrapi/physics';
import { IViewport } from '@plasmastrapi/viewport';
import ImpulsesComponent from 'app/components/ImpulsesComponent';

const I = 0.5 * 50 * 50;
const INV_I = 1 / I;

export default class ImpulsesSystem extends System {
  public once({
    components,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    systems: ISystemMaster;
    deltaTime: number;
    viewport: IViewport<any>;
  }): void {
    components.forEvery(ImpulsesComponent)((impulses) => {
      const { values } = impulses.copy();
      const entity = impulses.$entity;
      const pose = entity.$copy(PoseComponent);
      const result = values.reduce(
        (result, impulse) => {
          result.x += impulse.direction.x * impulse.magnitude;
          result.y += impulse.direction.y * impulse.magnitude;
          const r = Vector.normalizeFromPoints(impulse.origin, pose);
          result.w -= Vector.crossProduct(r, impulse) * INV_I;
          return result;
        },
        { x: 0, y: 0, w: 0 },
      );
      const velocity = entity.$copy(VelocityComponent);
      entity.$patch(VelocityComponent, {
        x: velocity.x + result.x,
        y: velocity.y + result.y,
        w: velocity.w + result.w,
      });
      impulses.mutate({ values: [] });
    });
  }
}
