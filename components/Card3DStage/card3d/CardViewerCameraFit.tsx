import { useLayoutEffect, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  CARD_VIEWER_DEFAULT_INSETS,
  computeCardViewerCameraDistance,
  resolveCardViewerDimensions,
  type CardViewerFitInsets,
} from "./cardViewerFit";
import type { CardOrientation } from "./constants";

type CardViewerCameraFitProps = {
  aspectRatio: number;
  orientation: CardOrientation;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  fitInsets?: CardViewerFitInsets;
  vFovDeg?: number;
};

export function CardViewerCameraFit({
  aspectRatio,
  orientation,
  controlsRef,
  fitInsets = CARD_VIEWER_DEFAULT_INSETS,
  vFovDeg = 34,
}: CardViewerCameraFitProps) {
  const { camera, size } = useThree();
  const perspectiveCamera = camera as PerspectiveCamera;

  useLayoutEffect(() => {
    if (size.width <= 0 || size.height <= 0) return;

    const { width, height } = resolveCardViewerDimensions(aspectRatio, orientation);
    const distance = computeCardViewerCameraDistance(
      width,
      height,
      size.width,
      size.height,
      vFovDeg,
      fitInsets,
    );

    perspectiveCamera.position.set(0, 0.05, distance);
    perspectiveCamera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.minDistance = distance * 0.92;
      controls.maxDistance = distance * 1.4;
      controls.update();
    }
  }, [
    aspectRatio,
    controlsRef,
    fitInsets.padX,
    fitInsets.padY,
    orientation,
    perspectiveCamera,
    size.height,
    size.width,
    vFovDeg,
  ]);

  return null;
}
