"use client";

import { useState, type CSSProperties } from "react";
import { CARD_PORTRAIT_ASPECT } from "./cardImageAspect";
import { BareCard3DViewer } from "./BareCard3DViewer";
import type { CardOrientation } from "./card3d";
import defaultBack from "./assets/yamal-back.webp";
import defaultFront from "./assets/yamal-front.webp";
import styles from "./Card3DStage.module.css";

export type Card3DOption = {
  id: string;
  label: string;
  frontSrc: string;
  backSrc?: string | null;
};

export type Card3DStageProps = {
  frontSrc?: string;
  backSrc?: string | null;
  cards?: readonly Card3DOption[];
  initialCardId?: string;
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
  cards,
  initialCardId,
  size = 498,
  background =
    "linear-gradient(219.25deg, rgba(102, 102, 102, 0.2) 0.69%, rgba(0, 0, 0, 0.2) 99.31%), #030712",
  ariaLabel = "Interactive 3D collectible card. Drag in any direction to turn the card and reveal its back.",
  className,
  style,
}: Card3DStageProps) {
  const cardOptions: readonly Card3DOption[] =
    cards && cards.length > 0
      ? cards
      : [
          {
            id: "default",
            label: "Featured player",
            frontSrc,
            backSrc,
          },
        ];
  const [selectedCardId, setSelectedCardId] = useState(
    initialCardId ?? cardOptions[0].id,
  );
  const [orientation, setOrientation] =
    useState<CardOrientation>("portrait");
  const selectedCard =
    cardOptions.find((card) => card.id === selectedCardId) ?? cardOptions[0];
  const cardAspect =
    orientation === "landscape"
      ? 1 / CARD_PORTRAIT_ASPECT
      : CARD_PORTRAIT_ASPECT;

  return (
    <>
      {cardOptions.flatMap((card) => [
        <link
          key={`${card.id}-front`}
          rel="preload"
          as="image"
          href={card.frontSrc}
        />,
        card.backSrc ? (
          <link
            key={`${card.id}-back`}
            rel="preload"
            as="image"
            href={card.backSrc}
          />
        ) : null,
      ])}
      <div
        className={[styles.stage, className ?? ""].filter(Boolean).join(" ")}
        style={{
          "--card-3d-stage-size": toCssSize(size),
          background,
          ...style,
        } as CSSProperties}
        role="group"
        aria-label={ariaLabel}
      >
        <BareCard3DViewer
          frontImageUrl={selectedCard.frontSrc}
          backImageUrl={selectedCard.backSrc}
          orientation={orientation}
          aspectRatio={cardAspect}
        />
        {cardOptions.length > 1 ? (
          <div
            className={styles.playerPicker}
            role="group"
            aria-label="Choose a player"
          >
            {cardOptions.map((card) => {
              const selected = card.id === selectedCard.id;

              return (
                <button
                  className={styles.playerButton}
                  type="button"
                  key={card.id}
                  aria-label={`Show ${card.label} card`}
                  aria-pressed={selected}
                  data-selected={selected ? "" : undefined}
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <img src={card.frontSrc} alt="" draggable={false} />
                </button>
              );
            })}
          </div>
        ) : null}
        <button
          className={styles.rotateButton}
          type="button"
          aria-label={
            orientation === "portrait"
              ? "Rotate card to landscape"
              : "Rotate card to portrait"
          }
          aria-pressed={orientation === "landscape"}
          onClick={() =>
            setOrientation((current) =>
              current === "portrait" ? "landscape" : "portrait",
            )
          }
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M17.65 6.35A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.76-4.24L13 11h7V4l-2.35 2.35Z" />
          </svg>
        </button>
        <span className={styles.instructions}>Drag to rotate the card</span>
      </div>
    </>
  );
}
