import { Component } from '@plasmastrapi/ecs';

export interface ITorques {
  values: number[];
}

export default class TorquesComponent extends Component<ITorques> {}
