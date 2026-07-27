export const focusedCardGuide = {
  tags: ["Interaction design", "Collectibles", "Component"],
  whatYouSee: [
    "I pulled one card out of the ASK UNK detail screen and put it on a quiet canvas. No product chrome around it — just the card, so you can drag, flip, and turn it.",
    "Pick Yamal, Haaland, or Messi from the thumbnails. Drag anywhere to orbit. The bottom-right control flips portrait and landscape. Same damping, idle motion, and studio shine as the product, just isolated.",
  ],
  howToBuild: [
    "Drop Card3DStage into a square frame and give it front/back art for each player.",
    "Want the thumbnail rail? Pass a cards array — id, label, textures, and crop offsets if faces need to sit in the circle.",
    "Keep orbit damping and idle motion on so the card still feels physical when you let go.",
    "Wire the rotate control to swap portrait and landscape on the physical card, not by stretching the texture.",
    "If reduced motion is on, ease off the idle drift and keep the drag response simple.",
  ],
  sectionTitles: {
    howToBuild: "How it works",
  },
};

export function buildFocusedCardMountSnippet() {
  return `import { Card3DStage } from "./Card3DStage";

export function FocusedCardViewer() {
  return (
    <Card3DStage
      cards={[
        {
          id: "yamal",
          label: "Lamine Yamal",
          frontSrc: "/cards/yamal-front.webp",
          backSrc: "/cards/yamal-back.webp",
          thumbnailOffsetX: "-9%",
          thumbnailOffsetY: "56%",
          thumbnailScale: 1.55,
        },
        // …haaland, messi
      ]}
      initialCardId="yamal"
      size="100%"
      ariaLabel="Interactive player card. Drag to turn it."
    />
  );
}`;
}

export function buildFocusedCardOptionsSnippet() {
  return `type Card3DOption = {
  id: string;
  label: string;
  frontSrc: string;
  backSrc?: string | null;
  thumbnailOffsetX?: string;
  thumbnailOffsetY?: string;
  thumbnailScale?: number;
};

// Orbit + frame
// - drag anywhere to rotate the physical card
// - bottom-right control swaps portrait / landscape
// - idle motion + damping keep it feeling heavy
// - face shine tracks the studio light`;
}

export function buildFocusedCardLlmPrompt() {
  return `Build a focused collectible-card viewer as a drop-in React component (Three.js / R3F).

## Goal
Isolate a single sports card on a quiet dark canvas. People should be able to drag, flip, and turn it without the rest of a product UI around it.

## Behavior
- Drag in any direction to orbit the physical card and reveal the back.
- Optional circular thumbnail rail to switch between players (Yamal / Haaland / Messi style).
- Bottom-right control rotates the physical card between portrait and landscape (do not stretch textures).
- Keep orbit damping, soft idle motion, card depth, and a moving studio shine on the front face.
- Respect prefers-reduced-motion: reduce or remove idle drift.

## Suggested mount
${buildFocusedCardMountSnippet()}

## Implementation outline
1. Mount a Three.js card with front/back textures on a dark studio backdrop.
2. Pointer drag drives orbit with damping; release settles instead of snapping hard.
3. Thumbnail rail swaps the active texture pair without remounting the whole stage.
4. Portrait/landscape control rotates the card geometry, not the image crop alone.
5. Add a soft face shine that tracks lighting so the surface still reads as printed foil/card stock.

## Deliverable
A self-contained React component folder with the viewer, styles, and sample card assets. Keep the API small: cards, initialCardId, size, ariaLabel.`;
}
