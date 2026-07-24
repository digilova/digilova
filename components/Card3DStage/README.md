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

The physical card remains portrait for both faces. A landscape back scan is
rotated onto the portrait back surface instead of changing the card's geometry.
