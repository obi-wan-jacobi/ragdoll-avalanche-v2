import { Component } from '@plasmastrapi/ecs';
import { INormalizedVector } from '@plasmastrapi/geometry';

export interface IForces {
  values: INormalizedVector[];
}

export default class ForcesComponent extends Component<IForces> {}
