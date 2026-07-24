"use client";

import { CardMediaStage } from "@/components/CardMediaStage";

export default function Preview() {
  return (
    <CardMediaStage
      frontSrc="/experiments/yamal/yamal-front.webp"
      backSrc="/experiments/yamal/yamal-back.webp"
      frontAlt="Lamine Yamal Topps Now card front"
      backAlt="Lamine Yamal Topps Now card back"
      size={498}
      ariaLabel="Lamine Yamal card viewer. Activate to show the other side."
    />
  );
}
