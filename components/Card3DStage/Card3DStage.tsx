"use client";

import {
  useEffect,
  useId,
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
import styles from "./Card3DStage.module.css";

const ROTATE_ICON_DURATION_MS = 200;
const ROTATE_ICON_PATHS = {
  start:
    "M10 21.93 C7.65 17.86 9.04 12.66 12.93 11 C17 8.65 22.2 10.04 24.29 13.68",
  middle:
    "M10 21.93 C12.33 20.62 14.67 19.31 17 18 C19.33 16.64 21.67 15.29 24 13.93",
  end:
    "M9 20 C11.35 24.07 16.55 25.46 20.18 23.36 C24.24 21.01 25.64 15.81 23.29 11.75",
} as const;

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
  const [reduceMotion, setReduceMotion] = useState(false);
  const playerPickerRef = useRef<HTMLDivElement>(null);
  const rotationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotateMarkerId = `rotate-arrow-${useId().replaceAll(":", "")}`;
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
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  const rotatePath =
    orientation === "portrait"
      ? ROTATE_ICON_PATHS.start
      : ROTATE_ICON_PATHS.end;
  const rotatePathValues =
    rotationDirection === "backward"
      ? `${ROTATE_ICON_PATHS.end};${ROTATE_ICON_PATHS.middle};${ROTATE_ICON_PATHS.start}`
      : `${ROTATE_ICON_PATHS.start};${ROTATE_ICON_PATHS.middle};${ROTATE_ICON_PATHS.end}`;

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
            <svg viewBox="0 0 34 34" focusable="false">
              <defs>
                <marker
                  id={rotateMarkerId}
                  viewBox="0 0 5 5"
                  markerWidth="5"
                  markerHeight="5"
                  refX="4.5"
                  refY="2.5"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M0 0.25 4.75 2.5 0 4.75Z" fill="currentColor" />
                </marker>
              </defs>
              <path
                d={rotatePath}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
                markerEnd={`url(#${rotateMarkerId})`}
              >
                {rotationDirection && !reduceMotion ? (
                  <animate
                    key={`${rotationDirection}-${orientation}`}
                    attributeName="d"
                    dur={`${ROTATE_ICON_DURATION_MS}ms`}
                    values={rotatePathValues}
                    keyTimes="0;0.5;1"
                    calcMode="spline"
                    keySplines=".25 .1 .25 1;.25 .1 .25 1"
                    fill="freeze"
                  />
                ) : null}
              </path>
            </svg>
          </span>
        </button>
        <span className={styles.instructions}>Drag to rotate the card</span>
      </div>
    </>
  );
}
