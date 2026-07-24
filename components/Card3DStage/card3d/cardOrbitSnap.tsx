import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState, type MutableRefObject, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export type OrbitViewTarget = { az: number; pol: number } | null;
export type CardFace = "front" | "back";

const SNAP_LERP = 0.14;
const SNAP_EPSILON = 0.002;
const TAP_ROTATION_THRESHOLD = 0.02;

function normalizeAzimuth(az: number): number {
  let n = az;
  while (n > Math.PI) n -= Math.PI * 2;
  while (n < -Math.PI) n += Math.PI * 2;
  return n;
}

export function getNearestFaceOrbitSnap(
  controls: OrbitControlsImpl,
  neutralPolar?: number,
): { target: { az: number; pol: number }; face: CardFace } {
  const az = normalizeAzimuth(controls.getAzimuthalAngle());
  const faceFront = Math.abs(az) <= Math.PI / 2;

  return {
    face: faceFront ? "front" : "back",
    target: {
      az: faceFront ? 0 : Math.PI,
      pol: neutralPolar ?? controls.getPolarAngle(),
    },
  };
}

export function getNearestFaceOrbitTarget(
  controls: OrbitControlsImpl,
  neutralPolar = Math.PI * 0.5,
): { az: number; pol: number } {
  return getNearestFaceOrbitSnap(controls, neutralPolar).target;
}

type CardOrbitSnapAnimatorProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  target: OrbitViewTarget;
  onArrived: () => void;
};

export function CardOrbitSnapAnimator({ controlsRef, target, onArrived }: CardOrbitSnapAnimatorProps) {
  const arrivedRef = useRef(false);

  useFrame(() => {
    if (!target || !controlsRef.current) return;

    const ctrl = controlsRef.current;
    const curAz = ctrl.getAzimuthalAngle();
    const curPol = ctrl.getPolarAngle();

    let diffAz = target.az - curAz;
    if (diffAz > Math.PI) diffAz -= Math.PI * 2;
    if (diffAz < -Math.PI) diffAz += Math.PI * 2;
    const diffPol = target.pol - curPol;

    if (Math.abs(diffAz) < SNAP_EPSILON && Math.abs(diffPol) < SNAP_EPSILON) {
      if (!arrivedRef.current) {
        ctrl.setAzimuthalAngle(target.az);
        ctrl.setPolarAngle(target.pol);
        ctrl.update();
        arrivedRef.current = true;
        onArrived();
      }
      return;
    }

    arrivedRef.current = false;
    ctrl.setAzimuthalAngle(curAz + diffAz * SNAP_LERP);
    ctrl.setPolarAngle(curPol + diffPol * SNAP_LERP);
    ctrl.update();
  });

  return null;
}

type UseCardOrbitTapSnapOptions = {
  neutralPolar?: number;
  onFaceSnap?: (face: CardFace) => void;
  interactionRef?: MutableRefObject<{ dragging: boolean; lastEnd: number }>;
};

export function useCardOrbitTapSnap({
  neutralPolar,
  onFaceSnap,
  interactionRef,
}: UseCardOrbitTapSnapOptions = {}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const gestureStartRef = useRef<{ az: number; pol: number } | null>(null);
  const [snapTarget, setSnapTarget] = useState<OrbitViewTarget>(null);

  const clearSnap = useCallback(() => {
    setSnapTarget(null);
  }, []);

  const requestSnap = useCallback(() => {
    if (!controlsRef.current) return;
    const { target, face } = getNearestFaceOrbitSnap(controlsRef.current, neutralPolar);
    setSnapTarget(target);
    onFaceSnap?.(face);
  }, [neutralPolar, onFaceSnap]);

  const onOrbitStart = useCallback(() => {
    if (interactionRef) {
      interactionRef.current.dragging = true;
    }
    clearSnap();
    const ctrl = controlsRef.current;
    if (ctrl) {
      gestureStartRef.current = {
        az: ctrl.getAzimuthalAngle(),
        pol: ctrl.getPolarAngle(),
      };
    }
  }, [clearSnap, interactionRef]);

  const onOrbitEnd = useCallback(() => {
    if (interactionRef) {
      interactionRef.current.dragging = false;
      interactionRef.current.lastEnd = performance.now();
    }

    const ctrl = controlsRef.current;
    const start = gestureStartRef.current;
    gestureStartRef.current = null;
    if (!ctrl || !start) return;

    const dAz = Math.abs(ctrl.getAzimuthalAngle() - start.az);
    const dPol = Math.abs(ctrl.getPolarAngle() - start.pol);
    if (dAz < TAP_ROTATION_THRESHOLD && dPol < TAP_ROTATION_THRESHOLD) {
      requestSnap();
    }
  }, [interactionRef, requestSnap]);

  return {
    controlsRef,
    snapTarget,
    clearSnap,
    onOrbitStart,
    onOrbitEnd,
  };
}
