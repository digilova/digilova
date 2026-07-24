import { CARD_PORTRAIT_ASPECT } from "../cardImageAspect";
import { RAW_CARD_D, resolveCardDimensionsFromAspect, type CardOrientation } from "./constants";

const CARD_DISPLAY_SCALE = 1.05;
const FLOAT_MARGIN = 1.1;
const ORBIT_MARGIN = 1.08;

export const CARD_VIEWER_DEFAULT_INSETS = { padX: 24, padY: 60 } as const;

export type CardViewerFitInsets = {
  padX: number;
  padY: number;
};

export function resolveCardViewerDimensions(aspect: number, orientation: CardOrientation) {
  const preferredAspect = orientation === "landscape" ? 1 / CARD_PORTRAIT_ASPECT : CARD_PORTRAIT_ASPECT;
  const cardAspect = aspect > 0 ? aspect : preferredAspect;
  return resolveCardDimensionsFromAspect(cardAspect);
}

/**
 * Camera Z distance so the card fits inside the canvas with pixel insets on each edge.
 */
export function computeCardViewerCameraDistance(
  cardWidth: number,
  cardHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  vFovDeg: number,
  insets: CardViewerFitInsets = CARD_VIEWER_DEFAULT_INSETS,
): number {
  if (canvasWidth <= 0 || canvasHeight <= 0) return 7.1;

  const availW = Math.max(canvasWidth - insets.padX * 2, 1);
  const availH = Math.max(canvasHeight - insets.padY * 2, 1);
  const canvasAspect = canvasWidth / canvasHeight;
  const widthFraction = availW / canvasWidth;
  const heightFraction = availH / canvasHeight;

  const vFov = (vFovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * canvasAspect);

  const halfW =
    Math.sqrt(((cardWidth * CARD_DISPLAY_SCALE) / 2) ** 2 + (RAW_CARD_D / 2) ** 2) * ORBIT_MARGIN;
  const halfH = ((cardHeight * CARD_DISPLAY_SCALE) / 2) * FLOAT_MARGIN;

  const distForHeight = halfH / (Math.tan(vFov / 2) * heightFraction);
  const distForWidth = halfW / (Math.tan(hFov / 2) * widthFraction);

  return Math.max(distForHeight, distForWidth);
}

export { CARD_DISPLAY_SCALE };
