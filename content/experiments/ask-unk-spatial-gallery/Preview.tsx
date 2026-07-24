"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  SpatialCardGallery,
  type SpatialGalleryCard,
} from "@/components/SpatialCardGallery";

const galleryHeight = 600;
const landscapeCards = new Set([1, 2, 4, 16, 25, 26]);
const cards: SpatialGalleryCard[] = Array.from({ length: 32 }, (_, index) => {
  const number = index + 1;
  const filename = String(number).padStart(2, "0");

  return {
    id: `ask-unk-card-${filename}`,
    src: `/experiments/ask-unk/cards/card-${filename}.webp`,
    alt: `ASK UNK sports card ${number}`,
    aspectRatio: landscapeCards.has(number) ? 640 / 457 : 457 / 640,
  };
});

export default function Preview() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ width: 500, height: 304 });

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;

    const measure = () => {
      setFrame({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = frame.height > 0 ? frame.height / galleryHeight : 0;
  const logicalWidth = scale > 0 ? frame.width / scale : 0;

  return (
    <div className="ask-unk-gallery-preview" ref={frameRef}>
      {scale > 0 && (
        <div
          className="ask-unk-gallery-stage"
          style={{
            width: logicalWidth,
            height: galleryHeight,
            transform: `scale(${scale})`,
          }}
        >
          <SpatialCardGallery
            cards={cards}
            height={galleryHeight}
            ariaLabel="Explore the ASK UNK sports-card collection"
          />
        </div>
      )}
    </div>
  );
}
