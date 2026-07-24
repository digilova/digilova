import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import * as THREE from "three";

export type CardPointerState = { x: number; y: number };

export type CardPointerRef = RefObject<CardPointerState>;

export const CARD_POINTER_PARALLAX = {
  rotY: 0.06,
  rotX: 0.042,
  posX: 0.034,
  posY: 0.028,
  smooth: 0.09,
} as const;

export function stepPointerSmoothing(
  smoothed: CardPointerState,
  pointerRef?: CardPointerRef,
): CardPointerState {
  const tx = pointerRef?.current?.x ?? 0;
  const ty = pointerRef?.current?.y ?? 0;
  smoothed.x = THREE.MathUtils.lerp(smoothed.x, tx, CARD_POINTER_PARALLAX.smooth);
  smoothed.y = THREE.MathUtils.lerp(smoothed.y, ty, CARD_POINTER_PARALLAX.smooth);
  return smoothed;
}

export function useCardPointerTracking() {
  const pointerRef = useRef<CardPointerState>({ x: 0, y: 0 });

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRef.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }, []);

  const onPointerLeave = useCallback(() => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  }, []);

  return { pointerRef, onPointerMove, onPointerLeave };
}
