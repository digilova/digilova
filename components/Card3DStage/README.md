# Card3DStage

A portable extraction of ASK UNK's real-time collectible-card viewer. It uses the
same Three.js card geometry, studio lighting, orbit controls, idle motion,
damping, face snap, and animated front-face shine as the product experience.

## Install

Copy this complete folder, including `assets` and `card3d`, into a React project,
then install:

```sh
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

## Fastest start

```tsx
import { Card3DStage } from "./Card3DStage";

export function CardExperiment() {
  return <Card3DStage />;
}
```

## Custom card

```tsx
<Card3DStage
  frontSrc="/cards/my-card-front.webp"
  backSrc="/cards/my-card-back.webp"
  size={498}
  ariaLabel="Interactive 3D card. Drag to rotate it."
/>
```

By default, the physical card remains portrait for both faces. A landscape back
scan is rotated onto that portrait back surface. The bottom-right rotate control
lets the viewer explicitly switch the physical card between portrait and
landscape.

Pass a `cards` array to show the optional circular player thumbnails above the
bottom-right rotate control. Each option supplies its player label, front/back
texture pair, and optional thumbnail scale and face-center offsets.
