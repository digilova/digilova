import type { RefObject } from "react";

export type CardImageUrls = {
  backImageUrl: string | null;
  frontImageUrl: string | null;
};

export type CardInteractionRef = RefObject<{ dragging: boolean; lastEnd: number }>;
