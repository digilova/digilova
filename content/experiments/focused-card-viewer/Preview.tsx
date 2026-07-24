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
        },
        {
          id: "haaland",
          label: "Erling Haaland",
          frontSrc: "/experiments/players/haaland-front.webp",
          backSrc: "/experiments/players/haaland-back.webp",
        },
        {
          id: "messi",
          label: "Lionel Messi",
          frontSrc: "/experiments/players/messi-front.webp",
          backSrc: "/experiments/players/messi-back.webp",
        },
      ]}
      initialCardId="yamal"
      size={498}
      ariaLabel="Interactive player card viewer. Choose a player, then drag in any direction to turn the 3D card and reveal its back."
    />
  );
}
