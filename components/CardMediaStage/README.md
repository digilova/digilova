# CardMediaStage

A dependency-free, responsive square stage for presenting a collectible card
on the ASK UNK detail-view background.

```tsx
import { CardMediaStage } from "./CardMediaStage";

export function CardExperiment() {
  return <CardMediaStage />;
}
```

The bundled Yamal front and back images are functional defaults. Activate the
stage by clicking, tapping, pressing Enter, or pressing Space to switch sides.

```tsx
<CardMediaStage
  frontSrc="/cards/front.webp"
  backSrc="/cards/back.webp"
  size={498}
  frontAlt="Card front"
  backAlt="Card back"
/>
```

The component uses React and a CSS Module only. Copy the complete folder,
including `assets`, into another React project.
