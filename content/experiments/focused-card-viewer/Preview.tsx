"use client";

import { Card3DStage } from "@/components/Card3DStage";

export default function Preview() {
  return (
    <Card3DStage
      cards={[
        {
          id: "yamal",
          label: "Lamine Yamal",
          frontSrc: "/experiments/yamal/yamal-front.webp",
          backSrc: "/experiments/yamal/yamal-back.webp",
          thumbnailOffsetX: "-9%",
          thumbnailOffsetY: "56%",
          thumbnailScale: 1.55,
        },
        {
          id: "haaland",
          label: "Erling Haaland",
          frontSrc: "/experiments/players/haaland-front.webp",
          backSrc: "/experiments/players/haaland-back.webp",
          thumbnailOffsetX: "-28%",
          thumbnailOffsetY: "50%",
          thumbnailScale: 1.45,
        },
        {
          id: "messi",
          label: "Lionel Messi",
          frontSrc: "/experiments/players/messi-front.webp",
          backSrc: "/experiments/players/messi-back.webp",
          thumbnailOffsetX: "-29%",
          thumbnailOffsetY: "48%",
          thumbnailScale: 1.45,
        },
      ]}
      initialCardId="yamal"
      size={498}
      ariaLabel="Interactive player card viewer. Choose a player, then drag in any direction to turn the 3D card and reveal its back."
    />
  );
}
