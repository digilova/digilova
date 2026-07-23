"use client";

import { useState } from "react";

export function TrustMotionDemo() {
  const [active, setActive] = useState(false);

  return (
    <div className="motion-demo">
      <div
        className="motion-object"
        data-active={active}
        aria-hidden="true"
        style={
          {
            "--motion-duration": active ? "540ms" : "360ms",
          } as React.CSSProperties
        }
      />
      <button
        className="demo-button"
        type="button"
        onClick={() => setActive((value) => !value)}
      >
        {active ? "Reset motion" : "Run motion"}
      </button>
    </div>
  );
}
