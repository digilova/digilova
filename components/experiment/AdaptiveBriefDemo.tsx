"use client";

import { useMemo, useState } from "react";

const tones = {
  Calm: "Give people a clear next step without making the moment feel urgent.",
  Direct: "Make the decision legible, focused, and quick to act on.",
  Supportive: "Acknowledge uncertainty, then help people move forward.",
};

export function AdaptiveBriefDemo() {
  const [tone, setTone] = useState<keyof typeof tones>("Calm");
  const [guidance, setGuidance] = useState(55);

  const detail = useMemo(() => {
    if (guidance < 35) return "Light guidance · let people explore";
    if (guidance > 70) return "High guidance · recommend a clear path";
    return "Balanced guidance · explain and recommend";
  }, [guidance]);

  return (
    <div className="demo-card">
      <label>
        Voice
        <select
          value={tone}
          onChange={(event) =>
            setTone(event.target.value as keyof typeof tones)
          }
        >
          {Object.keys(tones).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <label>
        Guidance level
        <input
          type="range"
          min="0"
          max="100"
          value={guidance}
          onChange={(event) => setGuidance(Number(event.target.value))}
        />
      </label>
      <div className="brief-output" aria-live="polite">
        <strong>{detail}</strong>
        <p>{tones[tone]}</p>
      </div>
    </div>
  );
}
