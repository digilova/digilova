export const spatialGalleryGuide = {
  tags: ["Interaction design", "Spatial UI", "Prototype"],
  whatYouSee: [
    "I was poking at a dense sports-card grid and how it could open into a roomier spatial field without feeling like you left the collection.",
    "Same cards stay on screen the whole time. Compact five-row scan on one side, freer pan-and-zoom on the other. Click a card or pinch out to expand. Pinch in or tap empty space to come back.",
  ],
  howToBuild: [
    "Keep one card list and two layouts. Morph positions instead of swapping screens.",
    "In compact mode, lock cell size, gaps, and row count so scanning stays easy.",
    "In explore, spread them on a board and scale by distance so the focus feels bigger.",
    "Drag to pan. Pinch or trackpad zoom to enter/leave explore. Tap empty space — not a background card — to return.",
    "Keyboard: arrows, plus, minus, zero. If reduced motion is on, shorten or skip the morph.",
  ],
  sectionTitles: {
    howToBuild: "How it works",
  },
};

export function buildSpatialGalleryMountSnippet() {
  return `import {
  SpatialCardGallery,
  type SpatialGalleryCard,
} from "./SpatialCardGallery";

const cards: SpatialGalleryCard[] = [
  {
    id: "card-01",
    src: "/cards/card-01.webp",
    alt: "Sports card 1",
    aspectRatio: 457 / 640,
  },
  // …rest of the collection
];

export function SpatialGallery() {
  return (
    <SpatialCardGallery
      cards={cards}
      rows={5}
      height="100%"
      ariaLabel="Explore the sports-card collection"
    />
  );
}`;
}

export function buildSpatialGalleryLayoutSnippet() {
  return `const GRID_CELL = 88;
const GRID_GAP = 12;
const EXPLORE_CARD_WIDTH = 180;
const EXPLORE_COLUMNS = 4;

// Compact → explore
// - same DOM cards, interpolated rects
// - pinch out / click card enters explore
// - pinch in / empty-space tap returns to grid
// - focus scales ~0.46 at edge → ~1.48 at center`;
}

export function buildSpatialGalleryLlmPrompt() {
  return `Build a spatial card gallery as a drop-in React component (no Three.js required).

## Goal
Let people scan a dense card collection in a compact grid, then open into a freer spatial field without feeling like they left the collection. Continuity matters more than two separate screens.

## Behavior
- Compact grid for fast scanning (fixed cell size + gaps + row count).
- Explore mode for pan/zoom with distance-based scale toward the focused card.
- Same card elements stay mounted and morph between layouts.
- Drag to pan. Click a card or pinch out to enter explore. Pinch in or tap empty space (not a background card) to return.
- Keyboard: arrows pan, plus/minus zoom feel, zero resets.
- Respect prefers-reduced-motion: shorten or skip the morph.

## Suggested mount
${buildSpatialGalleryMountSnippet()}

## Layout constants to start from
${buildSpatialGalleryLayoutSnippet()}

## Implementation outline
1. Own one card manifest with id, src, alt, and portrait/landscape aspect ratios.
2. Compute grid rects and explore-board rects from the same list.
3. Animate rect/opacity between modes instead of unmounting.
4. Gate enter/exit on gesture thresholds so tiny pinches do not flip modes by accident.
5. Stop at selection — leave product navigation and 3D detail to the host app.

## Deliverable
A self-contained React folder with the gallery, CSS module, types, sample cards, and docs. API stays small: cards, rows, height, initialMode, ariaLabel, onCardClick.`;
}
