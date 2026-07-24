"use client";

import {
  SpatialCardGallery,
  type SpatialGalleryCard,
} from "@/components/SpatialCardGallery";

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
  return (
    <div className="ask-unk-gallery-preview">
      <SpatialCardGallery
        cards={cards}
        rows={5}
        height="100%"
        ariaLabel="Explore the ASK UNK sports-card collection"
      />
    </div>
  );
}
