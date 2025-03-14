import "./style.css";
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ThreeViewCube } from "../lib/three-view-cube";

const scene = new Scene();

const camera = new PerspectiveCamera(
  75,
  document.body.offsetWidth / document.body.offsetHeight,
  0.01,
  1000,
);

camera.position.set(0, 20, 0);
camera.lookAt(0, 0, 0);
scene.add(camera);

//#region Renderer setup
const renderer = new WebGLRenderer();
renderer.setClearColor(new Color("#dedede"));

const handleResize = () => {
  renderer.setSize(document.body.offsetWidth, document.body.offsetHeight);
  renderer.setPixelRatio(devicePixelRatio);

  camera.aspect = document.body.offsetWidth / document.body.offsetHeight;
  camera.updateProjectionMatrix();
};

handleResize();
window.addEventListener("resize", handleResize);
document.body.append(renderer.domElement);
//#endregion

//#region Basic scene
const controls = new OrbitControls(camera, renderer.domElement);

const ambientLight = new AmbientLight(new Color("#ffffff"), 1.5);
const directionalLight = new DirectionalLight(new Color("#ffffff"), 1.5);

scene.add(ambientLight, directionalLight);

const boxOne = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: new Color("#dc2e2e") }),
);
boxOne.position.set(-2, 0, 2);

const boxTwo = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: new Color("#c03c3c") }),
);
boxTwo.position.set(2, 0, 2);

const boxThree = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: new Color("#9b2727") }),
);
boxThree.position.set(0, 0, 0);

scene.add(boxOne, boxTwo, boxThree);
//#endregion

const controlsCube = new ThreeViewCube(controls);

const div: HTMLDivElement = document.createElement("div");
div.classList.add("view-cube");
div.append(controlsCube.domElement);
document.body.append(div);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    const targetPosition = controls.target.clone();

    const offsetVector = new Vector3(0, 0, 1e-8);

    offsetVector.applyQuaternion(camera.quaternion);

    const targetLook = new Vector3(
      targetPosition.x + offsetVector.x,
      targetPosition.y,
      targetPosition.z + offsetVector.z,
    ); //look down

    const object3d = new Object3D();
    object3d.position.copy(targetPosition);
    object3d.position.y -= 1;
    object3d.lookAt(targetLook);

    controlsCube.toDirection(object3d.quaternion);
  }
});

let time = 0;

const loop = (elapsed: number) => {
  renderer.render(scene, camera);
  if (!controlsCube.isAnimating) {
    controls.update();
  }
  const delta = elapsed - time;
  controlsCube.update(delta / 1000);
  time = elapsed;
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
