import { IComponentMaster, IEntityMaster, ISystemMaster, System } from '@plasmastrapi/ecs';
import { IViewport } from '@plasmastrapi/viewport';
import ForcesComponent from 'app/components/ForcesComponent';

export default class ForcesSystem extends System {
  public once({
    components,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    systems: ISystemMaster;
    deltaTime: number;
    viewport: IViewport<any>;
  }): void {
    components.forEvery(ForcesComponent)((forces) => {
      forces.mutate({ values: [] });
    });
  }
}
