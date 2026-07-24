import { useEffect, useState } from "react";
import * as THREE from "three";
import {
  CARD_PORTRAIT_ASPECT,
  getPhotoAspectRatio,
} from "../cardImageAspect";
import {
  orientationFromAspect,
  type CardOrientation,
} from "./constants";

export type ImageContentCrop = { x: number; y: number; w: number; h: number };

export type ImageContentAnalysis = {
  orientation: CardOrientation;
  aspect: number;
  crop: ImageContentCrop;
};

const CONTENT_SAMPLE_W = 280;
const CONTENT_THRESHOLD = 246;

function getTextureCanvasSize(aspect: number) {
  if (aspect >= 1) {
    return { width: 1260, height: Math.round(1260 / aspect) };
  }
  return { width: Math.round(1260 * aspect), height: 1260 };
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  crop: ImageContentCrop,
) {
  const { width, height } = ctx.canvas;
  const sx = crop.x * image.width;
  const sy = crop.y * image.height;
  const sw = crop.w * image.width;
  const sh = crop.h * image.height;
  const scale = Math.max(width / sw, height / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawFixedCardImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  crop: ImageContentCrop,
  targetAspect: number,
) {
  const imageAspect = image.width / image.height;
  const rotateToMatch =
    (targetAspect < 1 && imageAspect > 1) ||
    (targetAspect > 1 && imageAspect < 1);

  if (!rotateToMatch) {
    drawCoverImage(ctx, image, crop);
    return;
  }

  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(image, -height / 2, -width / 2, height, width);
  ctx.restore();
}

function measureContentCrop(image: HTMLImageElement): ImageContentCrop {
  const sampleH = Math.max(1, Math.round(CONTENT_SAMPLE_W * (image.height / image.width)));
  const canvas = document.createElement("canvas");
  canvas.width = CONTENT_SAMPLE_W;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { x: 0, y: 0, w: 1, h: 1 };
  }

  ctx.drawImage(image, 0, 0, CONTENT_SAMPLE_W, sampleH);
  const { data, width, height } = ctx.getImageData(0, 0, CONTENT_SAMPLE_W, sampleH);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hits = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < CONTENT_THRESHOLD || g < CONTENT_THRESHOLD || b < CONTENT_THRESHOLD) {
        hits += 1;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (hits < 12) {
    return { x: 0, y: 0, w: 1, h: 1 };
  }

  const pad = 3;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  return {
    x: minX / width,
    y: minY / height,
    w: (maxX - minX + 1) / width,
    h: (maxY - minY + 1) / height,
  };
}

export function analyzeImageContent(image: HTMLImageElement, imageUrl?: string | null): ImageContentAnalysis {
  const pathAspect = imageUrl ? getPhotoAspectRatio(imageUrl) : null;
  const crop = measureContentCrop(image);
  const contentWidth = crop.w * image.width;
  const contentHeight = crop.h * image.height;

  let aspect = contentWidth / contentHeight;
  if (!Number.isFinite(aspect) || aspect <= 0) {
    aspect = pathAspect ?? (image.width > image.height ? image.width / image.height : CARD_PORTRAIT_ASPECT);
  }

  aspect = THREE.MathUtils.clamp(aspect, 0.55, 1.8);

  return {
    orientation: orientationFromAspect(aspect),
    aspect,
    crop,
  };
}

export function makeCardTexture(
  side: "front" | "back",
  image?: HTMLImageElement,
  analysis?: ImageContentAnalysis,
  targetAspect?: number,
) {
  const resolved =
    analysis ??
    (image
      ? analyzeImageContent(image)
      : {
          orientation: "portrait" as const,
          aspect: CARD_PORTRAIT_ASPECT,
          crop: { x: 0, y: 0, w: 1, h: 1 },
        });

  const textureAspect = targetAspect ?? resolved.aspect;
  const { width, height } = getTextureCanvasSize(textureAspect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (image) {
    if (targetAspect) {
      drawFixedCardImage(ctx, image, resolved.crop, targetAspect);
    } else {
      drawCoverImage(ctx, image, resolved.crop);
    }
  } else {
    const insetX = width * 0.053;
    const insetY = height * 0.038;
    const innerX = width * 0.087;
    const innerY = height * 0.062;
    ctx.fillStyle = "#f7f8fa";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#d5dae2";
    ctx.lineWidth = 18;
    ctx.strokeRect(insetX, insetY, width - insetX * 2, height - insetY * 2);
    ctx.strokeStyle = "#eff2f6";
    ctx.lineWidth = 5;
    ctx.strokeRect(innerX, innerY, width - innerX * 2, height - innerY * 2);
    ctx.fillStyle = "#2a303b";
    ctx.font = "800 92px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(side === "front" ? "Card front" : "Card back", width / 2, height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

export type CardTextureState = {
  texture: THREE.CanvasTexture;
  orientation: CardOrientation;
  aspect: number;
};

function makePlaceholderAnalysis(imageUrl: string | null): ImageContentAnalysis {
  const aspect = imageUrl ? getPhotoAspectRatio(imageUrl) : CARD_PORTRAIT_ASPECT;
  return {
    orientation: orientationFromAspect(aspect),
    aspect,
    crop: { x: 0, y: 0, w: 1, h: 1 },
  };
}

export function useCardTexture(
  side: "front" | "back",
  imageUrl: string | null,
  targetAspect?: number,
): CardTextureState {
  const [state, setState] = useState<CardTextureState>(() => {
    const analysis = makePlaceholderAnalysis(imageUrl);
    return {
      texture: makeCardTexture(side, undefined, analysis, targetAspect),
      orientation: analysis.orientation,
      aspect: analysis.aspect,
    };
  });

  useEffect(() => {
    let cancelled = false;

    if (!imageUrl) {
      const analysis = makePlaceholderAnalysis(null);
      const next = makeCardTexture(side, undefined, analysis, targetAspect);
      setState({ texture: next, orientation: analysis.orientation, aspect: analysis.aspect });
      return () => next.dispose();
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (cancelled) return;
      const analysis = analyzeImageContent(image, imageUrl);
      const next = makeCardTexture(side, image, analysis, targetAspect);
      setState({ texture: next, orientation: analysis.orientation, aspect: analysis.aspect });
    };
    image.onerror = () => {
      if (cancelled) return;
      const analysis = makePlaceholderAnalysis(imageUrl);
      const next = makeCardTexture(side, undefined, analysis, targetAspect);
      setState({ texture: next, orientation: analysis.orientation, aspect: analysis.aspect });
    };
    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl, side, targetAspect]);

  useEffect(() => () => state.texture.dispose(), [state.texture]);

  return state;
}

export function resolveCardAspect(
  preferredAspect: number,
  ...detectedAspects: Array<number | undefined>
): number {
  if (preferredAspect > 1) return preferredAspect;
  const detected = detectedAspects.find((aspect) => aspect !== undefined && aspect > 1);
  return detected ?? preferredAspect;
}

export function resolveCardOrientation(
  preferred: CardOrientation,
  ...detected: Array<CardOrientation | undefined>
): CardOrientation {
  if (preferred === "landscape") return "landscape";
  return detected.some((value) => value === "landscape") ? "landscape" : "portrait";
}
