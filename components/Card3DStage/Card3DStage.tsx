"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CARD_PORTRAIT_ASPECT } from "./cardImageAspect";
import { BareCard3DViewer } from "./BareCard3DViewer";
import type { CardOrientation } from "./card3d";
import defaultBack from "./assets/yamal-back.webp";
import defaultFront from "./assets/yamal-front.webp";
import rotateFrameEnd from "./assets/rotate-frame-end.svg?url";
import rotateFrameMiddle from "./assets/rotate-frame-middle.svg?url";
import rotateFrameStart from "./assets/rotate-frame-start.svg?url";
import styles from "./Card3DStage.module.css";

const ROTATE_ICON_DURATION_MS = 200;

type RotationDirection = "forward" | "backward";

export type Card3DOption = {
  id: string;
  label: string;
  frontSrc: string;
  backSrc?: string | null;
  thumbnailOffsetX?: string;
  thumbnailOffsetY?: string;
  thumbnailScale?: number;
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
  const [rotationDirection, setRotationDirection] =
    useState<RotationDirection | null>(null);
  const playerPickerRef = useRef<HTMLDivElement>(null);
  const rotationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedCard =
    cardOptions.find((card) => card.id === selectedCardId) ?? cardOptions[0];
  const cardAspect =
    orientation === "landscape"
      ? 1 / CARD_PORTRAIT_ASPECT
      : CARD_PORTRAIT_ASPECT;
  const resetThumbnailScale = () => {
    playerPickerRef.current
      ?.querySelectorAll<HTMLElement>("[data-player-thumbnail]")
      .forEach((button) =>
        button.style.removeProperty("--thumbnail-proximity-scale"),
      );
  };
  const handleThumbnailProximity = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType === "touch") return;

    const influenceRadius = 96;
    const maximumLift = 0.04;

    playerPickerRef.current
      ?.querySelectorAll<HTMLElement>("[data-player-thumbnail]")
      .forEach((button) => {
        const bounds = button.getBoundingClientRect();
        const distance = Math.hypot(
          event.clientX - (bounds.left + bounds.width / 2),
          event.clientY - (bounds.top + bounds.height / 2),
        );
        const proximity = Math.max(0, 1 - distance / influenceRadius);
        const scale = 1 + proximity * maximumLift;

        button.style.setProperty(
          "--thumbnail-proximity-scale",
          scale.toFixed(3),
        );
      });
  };
  const handleOrientationChange = () => {
    const direction: RotationDirection =
      orientation === "portrait" ? "forward" : "backward";

    if (rotationTimerRef.current) {
      clearTimeout(rotationTimerRef.current);
    }

    setRotationDirection(direction);
    setOrientation((current) =>
      current === "portrait" ? "landscape" : "portrait",
    );
    rotationTimerRef.current = setTimeout(
      () => setRotationDirection(null),
      ROTATE_ICON_DURATION_MS,
    );
  };

  useEffect(
    () => () => {
      if (rotationTimerRef.current) {
        clearTimeout(rotationTimerRef.current);
      }
    },
    [],
  );

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
        onPointerMove={handleThumbnailProximity}
        onPointerLeave={resetThumbnailScale}
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
            ref={playerPickerRef}
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
                  data-player-thumbnail=""
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <img
                    src={card.frontSrc}
                    alt=""
                    draggable={false}
                    style={
                      {
                        "--thumbnail-offset-x":
                          card.thumbnailOffsetX ?? "0%",
                        "--thumbnail-offset-y":
                          card.thumbnailOffsetY ?? "0%",
                        "--thumbnail-scale":
                          card.thumbnailScale ?? 1.5,
                      } as CSSProperties
                    }
                  />
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
          onClick={handleOrientationChange}
        >
          <span
            className={styles.rotateIcon}
            data-direction={rotationDirection ?? undefined}
            data-orientation={orientation}
            aria-hidden="true"
          >
            <img
              className={styles.rotateFrameStart}
              src={rotateFrameStart}
              alt=""
            />
            <img
              className={styles.rotateFrameMiddle}
              src={rotateFrameMiddle}
              alt=""
            />
            <img
              className={styles.rotateFrameEnd}
              src={rotateFrameEnd}
              alt=""
            />
          </span>
        </button>
        <span className={styles.instructions}>Drag to rotate the card</span>
      </div>
    </>
  );
}
