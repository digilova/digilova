"use client";

import type { CSSProperties } from "react";
import { CARD_PORTRAIT_ASPECT } from "./cardImageAspect";
import { BareCard3DViewer } from "./BareCard3DViewer";
import defaultBack from "./assets/yamal-back.webp";
import defaultFront from "./assets/yamal-front.webp";
import styles from "./Card3DStage.module.css";

export type Card3DStageProps = {
  frontSrc?: string;
  backSrc?: string | null;
  size?: number | string;
  background?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

function toCssSize(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

export function Card3DStage({
  frontSrc = defaultFront,
  backSrc = defaultBack,
  size = 498,
  background =
    "linear-gradient(219.25deg, rgba(102, 102, 102, 0.2) 0.69%, rgba(0, 0, 0, 0.2) 99.31%), #030712",
  ariaLabel = "Interactive 3D collectible card. Drag in any direction to turn the card and reveal its back.",
  className,
  style,
}: Card3DStageProps) {
  return (
    <>
      <link rel="preload" as="image" href={frontSrc} />
      {backSrc ? <link rel="preload" as="image" href={backSrc} /> : null}
      <div
        className={[styles.stage, className ?? ""].filter(Boolean).join(" ")}
        style={{
          "--card-3d-stage-size": toCssSize(size),
          background,
          ...style,
        } as CSSProperties}
        role="img"
        aria-label={ariaLabel}
      >
        <BareCard3DViewer
          frontImageUrl={frontSrc}
          backImageUrl={backSrc}
          orientation="portrait"
          aspectRatio={CARD_PORTRAIT_ASPECT}
        />
        <span className={styles.instructions}>Drag to rotate the card</span>
      </div>
    </>
  );
}
