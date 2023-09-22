import { Component } from '@plasmastrapi/ecs';
import { INormalizedVector, IPoint } from '@plasmastrapi/geometry';

export interface IImpulses {
  values: IImpulse[];
}

export interface IImpulse extends INormalizedVector {
  origin: IPoint;
}

export default class ImpulsesComponent extends Component<IImpulses> {}
