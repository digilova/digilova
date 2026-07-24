import { useLayoutEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { CARD_LANDSCAPE_ASPECT, CARD_PORTRAIT_ASPECT } from "../cardImageAspect";
import { attachStudioShineShader, CardStudioShineDriver } from "./cardFaceShine";
import {
  RAW_CARD_D,
  RAW_CARD_RADIUS,
  resolveCardDimensionsFromAspect,
  type CardOrientation,
} from "./constants";
import {
  makeFlatRoundedCardBodyGeometry,
  makeRoundedCardFaceGeometry,
} from "./geometry";
import type { CardImageUrls } from "./types";
import { useCardTexture } from "./textures";

function RoundedCardFace({
  map,
  position,
  rotation,
  roughness,
  faceWidth,
  faceHeight,
  shine = false,
}: {
  map: THREE.Texture;
  position: [number, number, number];
  rotation?: [number, number, number];
  roughness: number;
  faceWidth: number;
  faceHeight: number;
  shine?: boolean;
}) {
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const geometry = useMemo(
    () => makeRoundedCardFaceGeometry(faceWidth, faceHeight, RAW_CARD_RADIUS),
    [faceHeight, faceWidth],
  );

  useLayoutEffect(() => {
    if (shine && materialRef.current) {
      attachStudioShineShader(materialRef.current);
    }
  }, [shine]);

  return (
    <>
      <mesh geometry={geometry} position={position} rotation={rotation}>
        <meshPhysicalMaterial
          ref={materialRef}
          clearcoat={shine ? 0.72 : 0.62}
          clearcoatRoughness={shine ? 0.22 : 0.28}
          map={map}
          polygonOffset
          polygonOffsetFactor={-1}
          roughness={roughness}
          sheen={0.1}
          sheenRoughness={0.35}
        />
      </mesh>
      {shine && <CardStudioShineDriver materialRef={materialRef} />}
    </>
  );
}

export function RawCard({
  backImageUrl,
  frontImageUrl,
  shine = false,
  orientation = "portrait",
}: CardImageUrls & { shine?: boolean; orientation?: CardOrientation }) {
  const preferredAspect = orientation === "landscape" ? CARD_LANDSCAPE_ASPECT : CARD_PORTRAIT_ASPECT;
  const front = useCardTexture("front", frontImageUrl, preferredAspect);
  const back = useCardTexture("back", backImageUrl, preferredAspect);
  const cardAspect = preferredAspect;
  const { width, height } = resolveCardDimensionsFromAspect(cardAspect);
  const faceWidth = width;
  const faceHeight = height;
  const meshKey = `${width.toFixed(3)}x${height.toFixed(3)}`;
  const bodyGeometry = useMemo(
    () =>
      makeFlatRoundedCardBodyGeometry(
        width,
        height,
        RAW_CARD_RADIUS,
        RAW_CARD_D,
      ),
    [height, width],
  );

  return (
    <group key={meshKey}>
      <mesh geometry={bodyGeometry}>
        <meshStandardMaterial color="#eee7dc" roughness={0.78} metalness={0} />
      </mesh>
      <RoundedCardFace
        map={front.texture}
        position={[0, 0, RAW_CARD_D / 2 + 0.0005]}
        roughness={0.34}
        faceWidth={faceWidth}
        faceHeight={faceHeight}
        shine={shine}
      />
      <RoundedCardFace
        map={back.texture}
        position={[0, 0, -RAW_CARD_D / 2 - 0.0005]}
        rotation={[0, Math.PI, 0]}
        roughness={0.44}
        faceWidth={faceWidth}
        faceHeight={faceHeight}
      />
    </group>
  );
}
