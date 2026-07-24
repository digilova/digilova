"use client";

import { Card3DStage } from "@/components/Card3DStage";

export default function Preview() {
  return (
    <Card3DStage
      frontSrc="/experiments/yamal/yamal-front.webp"
      backSrc="/experiments/yamal/yamal-back.webp"
      size={498}
      ariaLabel="Lamine Yamal card viewer. Drag in any direction to turn the 3D card and reveal its back."
    />
  );
}
