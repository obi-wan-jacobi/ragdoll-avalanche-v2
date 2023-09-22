import { IComponentMaster, IEntityMaster, ISystemMaster, System } from '@plasmastrapi/ecs';
import { IViewport } from '@plasmastrapi/viewport';
import TorquesComponent from 'app/components/TorquesComponent';

export default class TorquesSystem extends System {
  public once({
    components,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    systems: ISystemMaster;
    deltaTime: number;
    viewport: IViewport<any>;
  }): void {
    components.forEvery(TorquesComponent)((torques) => {
      torques.mutate({ values: [] });
    });
  }
}
