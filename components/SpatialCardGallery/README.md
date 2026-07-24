# Spatial Card Gallery

A portable React component for exploring a dense image collection by panning and zooming.
The folder owns its component, styles, types, default data, and image assets, so it can be
copied into another repository without relying on ASK UNK.

## Copy it into a project

1. Copy the entire `SpatialCardGallery` folder into the destination's component directory.
2. Keep `assets`, `galleryCards.ts`, and `SpatialCardGallery.module.css` beside the component.
3. Import from the folder's `index.ts`.
4. Commit the complete folder, then run the destination's production build to verify asset URLs.

The component requires React and CSS Module support. It has no other runtime dependencies.

## Fastest start

```tsx
import { SpatialCardGallery } from "./SpatialCardGallery";

export function GalleryDemo() {
  return <SpatialCardGallery />;
}
```

## Responsive portfolio tile

```tsx
import { SpatialCardGallery } from "./SpatialCardGallery";

export function GalleryExperiment() {
  return (
    <article style={{ display: "grid", gap: 16 }}>
      <div style={{ width: "100%" }}>
        <SpatialCardGallery
          height={600}
          ariaLabel="Explore the ASK UNK sports-card collection"
          onCardClick={(card) => console.log("Selected", card.id)}
        />
      </div>
      <div>
        <h2 style={{ margin: 0, fontSize: 18 }}>ASK UNK — spatial card gallery</h2>
        <p style={{ margin: "6px 0 0", color: "#687080" }}>
          A pan-and-zoom study for browsing a dense collection without losing spatial context.
        </p>
      </div>
    </article>
  );
}
```

The gallery fills its parent’s width. A wider parent reveals more canvas on the
left and right without changing card sizes, spacing, rows, spatial positions, or
zoom behavior.

## Custom card collection

```tsx
import {
  SpatialCardGallery,
  type SpatialGalleryCard,
} from "./SpatialCardGallery";

const cards: SpatialGalleryCard[] = [
  {
    id: "rookie-01",
    src: new URL("./assets/my-card.webp", import.meta.url).href,
    alt: "2024 rookie basketball card",
    aspectRatio: 875 / 1225,
  },
  {
    id: "archive-02",
    src: "https://images.example.com/archive-02.webp",
    alt: "Vintage baseball card from the archive",
  },
];

export function CustomGallery() {
  return <SpatialCardGallery cards={cards} rows={4} />;
}
```

The bundled defaults use `new URL("./assets/...", import.meta.url).href`, which works in
Vite-based builds without a project-specific public path.

## Visual customization

```tsx
<SpatialCardGallery
  rows="auto"
  height={480}
  initialMode="grid"
  background="#10152d"
  ariaLabel="Explore the archive"
/>
```

Six fixed rows are the default, matching ASK UNK's 88px cells, 12px gaps, and
24px horizontal padding. Use `rows="auto"` only when a smaller embed needs to
fit the whole collection inside its measured width and height.

## Interaction and accessibility

- Tap a compact-grid card or pinch out to enter the explore field.
- Drag with a mouse, pen, or one finger to pan with momentum.
- Tap an off-center card to spring it into focus. Tap the centered card again
  to call `onCardClick`.
- Pinch out with two fingers or zoom out with Control/Command plus a trackpad
  gesture to morph from the compact grid into the free-pan field.
- Pinch in or reverse the trackpad gesture to return to the responsive grid.
- Use arrow keys to pan, plus/minus to switch views, and zero to reset.
- Normal wheel scrolling remains available to the surrounding page.
- The component respects `prefers-reduced-motion`.
- Supply `alt` text and `aspectRatio` when custom images convey information or
  use a non-portrait proportion.

## Pattern for another portable component

Use this folder as a template:

1. Keep the component, styles, types, local assets, exports, and README together.
2. Replace application contexts and data imports with a small public prop interface.
3. Resolve bundled assets relative to the component instead of a repository-level public path.
4. Namespace internal styles or use a CSS Module.
5. Ship a useful default while allowing consumers to provide their own data.
6. Add a live catalog demo and complete copyable examples.
7. Copy the folder into an isolated fixture and run a production build before marking it ready.
