export const CARD_W = 2.5;
export const CARD_H = 3.5;
/** Depth for inset cards inside holders (toploader, slab, etc.). */
export const CARD_D = 0.045;
/** Bare / raw card stock depth — matches studio Card Holder bare thickness. */
export const RAW_CARD_D = CARD_D;
export const RAW_CARD_RADIUS = 0.075;

export type CardOrientation = "portrait" | "landscape";

export function resolveCardDimensions(orientation: CardOrientation = "portrait") {
  if (orientation === "landscape") {
    return { width: CARD_H, height: CARD_W };
  }
  return { width: CARD_W, height: CARD_H };
}

/** Map a width/height aspect ratio to 3D card dimensions (long side = CARD_H). */
export function resolveCardDimensionsFromAspect(aspect: number) {
  const longSide = CARD_H;
  if (aspect >= 1) {
    return { width: longSide, height: longSide / aspect };
  }
  return { width: longSide * aspect, height: longSide };
}

export function orientationFromAspect(aspect: number): CardOrientation {
  return aspect > 1 ? "landscape" : "portrait";
}
