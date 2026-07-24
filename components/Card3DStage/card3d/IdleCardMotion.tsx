import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { CARD_POINTER_PARALLAX, stepPointerSmoothing, type CardPointerRef } from "./cardPointerParallax";
import type { CardInteractionRef } from "./types";

type IdleCardMotionProps = {
  children: ReactNode;
  interactionRef: CardInteractionRef;
  pointerRef?: CardPointerRef;
};

export function IdleCardMotion({ children, interactionRef, pointerRef }: IdleCardMotionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const idleStrength = useRef(1);
  const pointerSmoothed = useRef({ x: 0, y: 0 });

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const { dragging, lastEnd } = interactionRef.current ?? { dragging: false, lastEnd: 0 };
    const recentlyDragged = performance.now() - lastEnd < 1400;
    const targetIdle = dragging || recentlyDragged ? 0 : 1;
    idleStrength.current = THREE.MathUtils.lerp(idleStrength.current, targetIdle, 0.05);

    const t = clock.elapsedTime;
    const strength = idleStrength.current;
    const pointer = stepPointerSmoothing(pointerSmoothed.current, pointerRef);
    const px = pointer.x * strength;
    const py = pointer.y * strength;

    groupRef.current.position.y =
      Math.sin(t * 0.42) * 0.055 * strength + py * CARD_POINTER_PARALLAX.posY;
    groupRef.current.position.x =
      Math.sin(t * 0.34 + 0.9) * 0.028 * strength + px * CARD_POINTER_PARALLAX.posX;
    groupRef.current.rotation.y =
      Math.sin(t * 0.32) * 0.07 * strength + px * CARD_POINTER_PARALLAX.rotY;
    groupRef.current.rotation.x =
      Math.sin(t * 0.26 + 1.1) * 0.032 * strength - py * CARD_POINTER_PARALLAX.rotX;
    groupRef.current.rotation.z = Math.sin(t * 0.21 + 0.4) * 0.018 * strength;
  });

  return <group ref={groupRef}>{children}</group>;
}
