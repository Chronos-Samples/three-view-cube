import {
  Euler,
  EventDispatcher,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector2,
  Vector3,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MapControls } from "three/examples/jsm/controls/MapControls";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { createCube, getSide, rotateDirection, Side } from "./utils";
import "./three-view-cube.css";

export interface ThreeViewCubeEventMap {
  viewChange: { direction: Vector3; rotation: Euler };
}

function easeOutCubic(t: number) {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
}

export class ThreeViewCube extends EventDispatcher<ThreeViewCubeEventMap> {
  private _renderer: CSS3DRenderer;
  private readonly _scene: Scene;
  private readonly _camera: PerspectiveCamera;
  private _cameraControls: OrbitControls | MapControls;

  private _resolution: Vector2 = new Vector2();
  private _superResolutionFactor: number = 4;
  private _orbitRadius: number = 220;
  private _animationDuration: number = 0.3;

  private _cubeContainer: HTMLDivElement = document.createElement(
    "div",
  ) as HTMLDivElement;

  private direction0 = new Vector3();
  private _quaternion0: Quaternion | null = null;
  private _quaternion1: Quaternion | null = null;
  private _quaternionLerp: Quaternion = new Quaternion();
  private _progress = 0;
  private _side: Side | null = null;
  private _sideButtonContainer: HTMLDivElement;

  private _isAnimating: boolean = false;

  public get isAnimating() {
    return this._isAnimating;
  }

  public get plane() {
    return this._side ? this._side.PLANE : null;
  }

  public get resolution(): Vector2 {
    return this._resolution;
  }

  public set resolution(value: Vector2) {
    const superResolution = new Vector2()
      .copy(value)
      .multiplyScalar(this._superResolutionFactor);
    this._resolution.copy(value);
    this._renderer.setSize(superResolution.x, superResolution.y);
    this._renderer.domElement.style.transform = `translate(-50%, -50%) scale(${1 / this._superResolutionFactor})`;
    this._cubeContainer.style.width = `${value.x}px`;
    this._cubeContainer.style.height = `${value.y}px`;

    this._camera.aspect = value.x / value.y;
    this._camera.updateProjectionMatrix();
  }

  public get domElement() {
    return this._cubeContainer;
  }

  constructor(cameraControls: OrbitControls | MapControls) {
    super();
    this.updateCamera = this.updateCamera.bind(this);
    this.toSide = this.toSide.bind(this);

    this._scene = new Scene();

    //#region Renderer
    this._renderer = new CSS3DRenderer();
    //#endregion

    //#region Camera
    this._camera = new PerspectiveCamera(30, 1, 0.001, 10);
    this._cameraControls = cameraControls;
    //#endregion

    //#region Link with camera controls
    cameraControls.addEventListener("change", this.updateCamera);
    this.updateCamera();
    //#endregion

    this.resolution = new Vector2(96, 96);

    const sideObjects = createCube(32, this.toSide);
    this._scene.add(...sideObjects);

    this._cubeContainer.classList.add("cube-container");
    this._cubeContainer.append(this._renderer.domElement);
    this._renderer.domElement.classList.add("cube-renderer");

    const sideButtonContainer = document.createElement("div");
    sideButtonContainer.className = "side-button-container";
    this._cubeContainer.append(sideButtonContainer);
    this._sideButtonContainer = sideButtonContainer;

    for (let i = 0; i < 4; i++) {
      const sideButton = document.createElement("button");
      sideButton.className = "cube-side-button";
      sideButton.addEventListener("pointerdown", () => {
        if (this._isAnimating) return;

        this._quaternion0 = new Quaternion().copy(this._camera.quaternion);
        this._quaternion1 = new Quaternion()
          .copy(this._camera.quaternion)
          .multiply(rotateDirection[i]);
        this._progress = 0;
        this._isAnimating = true;
      });
      sideButtonContainer.append(sideButton);
    }
    this.render();
  }

  public toSide(side: Side) {
    this._quaternion0 = new Quaternion().copy(this._camera.quaternion);
    this._quaternion1 = new Quaternion().copy(side.DIRECTION);
    this._progress = 0;
    this._isAnimating = true;
  }

  public toDirection(quaternion: Quaternion) {
    if (this._isAnimating) return;

    this._quaternion0 = new Quaternion().copy(this._camera.quaternion);
    this._quaternion1 = new Quaternion().copy(quaternion);
    if (this._quaternion0.angleTo(this._quaternion1) < 1e-4) return;

    this._progress = 0;
    this._isAnimating = true;
  }

  public updateCamera() {
    this.direction0
      .subVectors(
        this._cameraControls.object.position,
        this._cameraControls.target,
      )
      .normalize()
      .multiplyScalar(this._orbitRadius);

    this._camera.position.copy(this.direction0);
    this._camera.quaternion.copy(this._cameraControls.object.quaternion);

    if (!this._isAnimating && !getSide(this._camera.quaternion)) {
      this._side = null;
    }
    this.render();
  }

  public update(delta: number) {
    this._sideButtonContainer.style.opacity = this._side ? "1" : "0";
    this._sideButtonContainer.style.pointerEvents = this._side ? "all" : "none";

    if (this._quaternion0 && this._quaternion1) {
      this._progress = Math.min(
        this._progress + delta / this._animationDuration,
        1,
      );
      const currentQuaternion = this._quaternionLerp.slerpQuaternions(
        this._quaternion0,
        this._quaternion1,
        easeOutCubic(this._progress),
      );
      this._camera.quaternion.copy(currentQuaternion);

      const position0 = new Vector3(0, 0, this._orbitRadius).applyQuaternion(
        currentQuaternion,
      );
      this._camera.position.copy(position0);

      // update attached camera
      const distance = this._cameraControls.object.position.distanceTo(
        this._cameraControls.target,
      );

      this._cameraControls.object.quaternion.copy(this._camera.quaternion);
      this._cameraControls.object.position
        .copy(this._camera.position)
        .normalize()
        .multiplyScalar(distance)
        .add(this._cameraControls.target);

      this.render();

      if (this._progress === 1) {
        this._side = getSide(this._quaternion1);
        this._isAnimating = false;
        this._quaternion0 = null;
        this._quaternion1 = null;
      }
    }
  }

  public render() {
    this._renderer.render(this._scene, this._camera);
  }
}
export default ThreeViewCube;
