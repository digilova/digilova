"use client";

import { Card3DStage } from "@/components/Card3DStage";
import { CARD_VIEWER_STUDY_CONTROL_RAIL_OFFSET_PX } from "@/components/Card3DStage/card3d/cardViewerFit";

const STUDY_FIT_INSETS = { padX: 22, padY: 18 } as const;

export default function Preview({
  className,
  variant = "list",
}: {
  className?: string;
  variant?: "list" | "study";
}) {
  const isStudy = variant === "study";

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
          thumbnailScale: 1.6,
        },
      ]}
      initialCardId="yamal"
      className={[className, isStudy ? "focused-card-study" : ""]
        .filter(Boolean)
        .join(" ")}
      size="100%"
      fitInsets={isStudy ? STUDY_FIT_INSETS : undefined}
      // Landing page stays geometrically centered. Study shifts right to
      // balance the player/rotate controls on the right edge.
      opticalCenterOffsetPx={isStudy ? CARD_VIEWER_STUDY_CONTROL_RAIL_OFFSET_PX : 0}
      ariaLabel="Interactive player card viewer. Choose a player, then drag in any direction to turn the 3D card and reveal its back."
    />
  );
}
