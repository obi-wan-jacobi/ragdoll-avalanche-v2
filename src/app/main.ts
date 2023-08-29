import { FPSSystem } from '@plasmastrapi/diagnostics';
import App from './App';
import { ImageSystem, LabelSystem, LineSystem, PoseSystem, ShapeSystem } from '@plasmastrapi/engine';
import { InputController } from '@plasmastrapi/html5-canvas';
import LevelController from './controllers/LevelController';
import { AccelerationSystem, GravitySystem, ImpulseSystem, VelocitySystem } from '@plasmastrapi/physics';
import { AnimationSystem } from '@plasmastrapi/animation';
import HandleController from './controllers/HandleController';
import HandleInputHandler from './input-handlers/HandleInputHandler';
import HandleSystem from './systems/HandleSystem';
import RagdollController from './controllers/RagdollController';
import RagdollInputHandler from './input-handlers/RagdollInputHandler';
import CollisionSystem from './systems/CollisionSystem';
import Atom from './entities/Atom';
import AtomSystem from './systems/AtomSystem';
import AtomController from './controllers/AtomController';
import AtomInputHandler from './input-handlers/AtomInputHandler';
import PhysicalVisualizationSystem from './systems/PhysicalVisualizationSystem';

const canvas = document.getElementById('app-target') as HTMLCanvasElement;
canvas.width = 1280;
canvas.height = 720;
canvas.focus();

export const app = new App({
  canvas,
  controllers: {
    input: new InputController({ canvas }),
    level: new LevelController(),
    handle: new HandleController(),
    ragdoll: new RagdollController(),
    atom: new AtomController(),
  },
  systems: [
    PoseSystem,
    ShapeSystem,
    LineSystem,
    LabelSystem,
    ImageSystem,
    // AnimationSystem,
    FPSSystem,
    ImpulseSystem,
    GravitySystem,
    AccelerationSystem,
    VelocitySystem,

    // HandleSystem,
    PhysicalVisualizationSystem,
    CollisionSystem,
    AtomSystem,
  ],
});

app.init();
app.controllers.input.setHandler(AtomInputHandler);
app.start();
