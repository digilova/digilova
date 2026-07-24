import { Float } from "@react-three/drei";
import { IdleCardMotion } from "./IdleCardMotion";
import { RawCard } from "./RawCard";
import type { CardOrientation } from "./constants";
import type { CardPointerRef } from "./cardPointerParallax";
import type { CardImageUrls, CardInteractionRef } from "./types";

type AnimatedBareCardProps = CardImageUrls & {
  interactionRef: CardInteractionRef;
  pointerRef?: CardPointerRef;
  shine?: boolean;
  scale?: number;
  orientation?: CardOrientation;
};

export function AnimatedBareCard({
  backImageUrl,
  frontImageUrl,
  interactionRef,
  pointerRef,
  shine = true,
  scale = 1.05,
  orientation = "portrait",
}: AnimatedBareCardProps) {
  return (
    <Float speed={1.15} rotationIntensity={0.18} floatIntensity={0.24} floatingRange={[-0.11, 0.11]}>
      <IdleCardMotion interactionRef={interactionRef} pointerRef={pointerRef}>
        <group scale={scale}>
          <RawCard
            frontImageUrl={frontImageUrl}
            backImageUrl={backImageUrl}
            shine={shine}
            orientation={orientation}
          />
        </group>
      </IdleCardMotion>
    </Float>
  );
}
