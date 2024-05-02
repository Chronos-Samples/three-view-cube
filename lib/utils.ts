import { Quaternion, Vector3 } from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";

export enum PLANE {
  XZ,
  XY,
  ZY,
}

export type Side = {
  PLANE: PLANE;
  POSITION: Vector3;
  DIRECTION: Quaternion;
};

export const SIDES = {
  FRONT: {
    PLANE: PLANE.XY,
    POSITION: new Vector3(0, 0, 1),
    DIRECTION: new Quaternion(0, 0, 0, 1),
  },
  BACK: {
    PLANE: PLANE.XY,
    POSITION: new Vector3(0, 0, -1),
    DIRECTION: new Quaternion(0, -1, 0, 0),
  },
  LEFT: {
    PLANE: PLANE.ZY,
    POSITION: new Vector3(-1, 0, 0),
    DIRECTION: new Quaternion(0, -0.7071067811865475, 0, 0.7071067811865476),
  },
  RIGHT: {
    PLANE: PLANE.ZY,
    POSITION: new Vector3(1, 0, 0),
    DIRECTION: new Quaternion(0, 0.7071067811865475, 0, 0.7071067811865476),
  },
  TOP: {
    PLANE: PLANE.XZ,
    POSITION: new Vector3(0, 1, 0),
    DIRECTION: new Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865476),
  },
  BOTTOM: {
    PLANE: PLANE.XZ,
    POSITION: new Vector3(0, -1, 0),
    DIRECTION: new Quaternion(0.7071067811865475, 0, 0, 0.7071067811865476),
  },
};

export const rotateDirection = [
  new Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865476),
  new Quaternion(0, 0.7071067811865475, 0, 0.7071067811865476),
  new Quaternion(0.7071067811865475, 0, 0, 0.7071067811865476),
  new Quaternion(0, -0.7071067811865475, 0, 0.7071067811865476),
];

export const getSide = (quaternion: Quaternion) => {
  const v = new Vector3(0, 0, 1).applyQuaternion(quaternion);
  const sideKey = (Object.keys(SIDES) as Array<keyof typeof SIDES>).find(
    (key) => {
      const vSide = new Vector3().copy(SIDES[key].POSITION);
      return v.distanceTo(vSide) < 0.01;
    },
  );
  return sideKey ? SIDES[sideKey] : null;
};

export const createCube = (radius: number, onClick: (value: Side) => void) => {
  const sideKeys = Object.keys(SIDES) as Array<keyof typeof SIDES>;

  return sideKeys.map((name) => {
    const sideElement = document.createElement("div");
    sideElement.className = `side`;
    sideElement.textContent = name;
    sideElement.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(SIDES[name] as Side);
    });

    const sideObject = new CSS3DObject(sideElement);
    sideObject.position.copy(SIDES[name].POSITION).multiplyScalar(radius);
    sideObject.quaternion.copy(SIDES[name].DIRECTION);
    sideObject.frustumCulled = false;
    return sideObject;
  });
};
