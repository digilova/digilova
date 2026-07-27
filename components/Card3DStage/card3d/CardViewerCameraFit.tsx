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

/**
 * Fit the card to the canvas with symmetric padding. Horizontal study balancing
 * for the right-hand controls is handled in the DOM (see BareCard3DViewer), so
 * the landing-page preview stays on the true geometric center.
 */
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

    perspectiveCamera.clearViewOffset();
    perspectiveCamera.position.set(0, 0.05, distance);
    perspectiveCamera.up.set(0, 1, 0);
    perspectiveCamera.lookAt(0, 0, 0);
    perspectiveCamera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.minDistance = distance * 0.88;
      controls.maxDistance = distance * 1.06;
      controls.setAzimuthalAngle(0);
      controls.setPolarAngle((Math.PI * 0.22 + Math.PI * 0.78) / 2);
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
