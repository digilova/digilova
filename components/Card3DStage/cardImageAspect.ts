export const CARD_PORTRAIT_ASPECT = 875 / 1225;
export const CARD_LANDSCAPE_ASPECT = 1225 / 875;

export function getPhotoAspectRatio(_path?: string) {
  return CARD_PORTRAIT_ASPECT;
}
