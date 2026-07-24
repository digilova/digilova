"use client";

import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import styles from "./CardMediaStage.module.css";
import defaultBack from "./assets/yamal-back.webp";
import defaultFront from "./assets/yamal-front.webp";

export type CardMediaSide = "front" | "back";

export type CardMediaStageProps = {
  frontSrc?: string;
  backSrc?: string | null;
  frontAlt?: string;
  backAlt?: string;
  size?: number | string;
  background?: string;
  initialSide?: CardMediaSide;
  ariaLabel?: string;
  onSideChange?: (side: CardMediaSide) => void;
  className?: string;
  style?: CSSProperties;
};

function toCssSize(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

export function CardMediaStage({
  frontSrc = defaultFront,
  backSrc = defaultBack,
  frontAlt = "Lamine Yamal Topps Now card front",
  backAlt = "Lamine Yamal Topps Now card back",
  size = 498,
  background =
    "linear-gradient(219.25deg, rgba(102, 102, 102, 0.2) 0.69%, rgba(0, 0, 0, 0.2) 99.31%), #030712",
  initialSide = "front",
  ariaLabel = "Lamine Yamal card viewer. Activate to show the other side.",
  onSideChange,
  className,
  style,
}: CardMediaStageProps) {
  const [side, setSide] = useState<CardMediaSide>(initialSide);
  const canFlip = Boolean(backSrc);

  function showSide(nextSide: CardMediaSide) {
    if (!canFlip || nextSide === side) return;
    setSide(nextSide);
    onSideChange?.(nextSide);
  }

  function toggleSide() {
    showSide(side === "front" ? "back" : "front");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!canFlip || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    toggleSide();
  }

  return (
    <div
      className={[styles.stage, className ?? ""].filter(Boolean).join(" ")}
      style={{
        "--card-media-stage-size": toCssSize(size),
        background,
        ...style,
      } as CSSProperties}
      role={canFlip ? "button" : "img"}
      tabIndex={canFlip ? 0 : undefined}
      aria-label={canFlip ? ariaLabel : frontAlt}
      aria-pressed={canFlip ? side === "back" : undefined}
      data-side={side}
      onClick={canFlip ? toggleSide : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.card}>
        <img
          className={`${styles.media} ${styles.front}`}
          src={frontSrc}
          alt={side === "front" ? frontAlt : ""}
          aria-hidden={side !== "front"}
          draggable={false}
        />
        {backSrc && (
          <img
            className={`${styles.media} ${styles.back}`}
            src={backSrc}
            alt={side === "back" ? backAlt : ""}
            aria-hidden={side !== "back"}
            draggable={false}
          />
        )}
      </div>
      <span className={styles.srOnly} aria-live="polite">
        Showing card {side}
      </span>
    </div>
  );
}
