import type { RippleSettings } from "./Preview";

export const rippleGuide = {
  tags: ["Motion", "WebGL", "Image treatment"],
  whatYouSee: [
    "A WebGL water ripple over a still photograph — defaulting to blue-and-white azulejo tiles, with drag-and-drop so you can try any image.",
    "Open the dock for play/pause, loop, cursor-follow origin, and inline scrubbers for speed, ripple count, and band width (up to 500%).",
  ],
  howToBuild: [
    "Change the controls above and these snippets update with them. Copy what you need into your own project.",
    "Cover-crop the photograph onto a full-screen WebGL quad so it always fills the frame without letterboxing or squashing.",
    "In the fragment shader, measure distance from u_origin (image center, or the pointer when cursor-follow is on). Run a few radial waves with offset phases so they do not pile into one thick ring.",
    "Along each crest, nudge the UVs and add a soft bright edge with a darker trough. That is mostly what sells the curve.",
    "Drive motion with elapsed time times speed. Loop with a modulo, or let a single pass drain out when loop is off. Clicking the image restarts the ripple from the current origin.",
    "Expose play/pause, loop, and cursor-follow as toggles. Expand speed / ripples / width into inline scrubbers instead of a separate detail screen.",
    "If reduced motion is on, skip the canvas and leave the photograph alone.",
  ],
  sectionTitles: {
    howToBuild: "How it works",
  },
};

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, "");
}

export function buildRippleSettingsSnippet(settings: RippleSettings) {
  return `const rippleSettings = {
  rippleCount: ${settings.rippleCount},
  speed: ${formatNumber(settings.speed)},
  bandWidth: ${formatNumber(settings.bandWidth)}, // 0.75–5.0 → 75%–500%
  loop: ${settings.loop},
  cursorFollow: ${settings.cursorFollow},
};`;
}

export function buildRippleUniformsSnippet(settings: RippleSettings) {
  const mode = settings.loop ? 1 : 0;
  return `// Wire your settings into the shader each frame
gl.uniform1f(uRippleCount, ${settings.rippleCount});
gl.uniform1f(uBandWidth, ${formatNumber(settings.bandWidth)});
gl.uniform1f(uMode, ${mode}); // 1 = loop, 0 = one-shot / drain
runtime.elapsed += deltaSeconds * ${formatNumber(settings.speed)};
gl.uniform1f(uTime, runtime.elapsed);
gl.uniform2f(
  uOrigin,
  ${settings.cursorFollow ? "pointer.x" : "0.5"},
  ${settings.cursorFollow ? "pointer.y" : "0.5"},
);`;
}

export function buildRippleLlmPrompt(settings: RippleSettings) {
  const mode = settings.loop
    ? "continuous loop (modulo travel)"
    : "one-shot then drain out";
  const origin = settings.cursorFollow
    ? "follow the pointer over the image"
    : "stay at the image center (0.5, 0.5)";

  return `Build a reusable image ripple treatment as a drop-in React + WebGL component.

## Goal
Create a radial water ripple over a still photograph. The photo itself must stay undistorted as a whole. Only a thin band of light bends over it. Swapping the image behind the effect should not require rebuilding the shader. Default to a cover-cropped photograph that fills the frame edge-to-edge (no letterboxing, no squashing).

## Behavior
- Radial wavefronts leave an origin, travel past the frame edges, and fade.
- Waves use staggered phases so they do not stack into one thick ring.
- Around each crest, displace UVs along the radial direction and add soft crest highlight + trough shadow so the band reads as curved water, not a hard circle.
- Support play/pause. Tapping the image should restart the ripple from the current origin, even if one is already playing.
- Support loop on/off: loop keeps waves cycling; off runs a one-shot that drains out.
- Support cursor-follow on/off: when on, u_origin tracks the pointer; when off, origin is the image center.
- Let people drag and drop (or pick) their own image onto the canvas. Cover-crop the texture to the display aspect so it always fills the frame.
- Expose speed, ripple count, and band width as inline expanding scrubbers (not a separate detail view). Band width ranges from 0.75 to 5.0 (75%–500%).
- Respect prefers-reduced-motion: skip the canvas and show the still photograph.

## Live settings to match
Use these defaults (expose them as controls or uniforms):
- rippleCount: ${settings.rippleCount} (range 1–5)
- speed: ${formatNumber(settings.speed)} (range 0.5–2)
- bandWidth: ${formatNumber(settings.bandWidth)} (range 0.75–5.0 → 75%–500%)
- loop: ${settings.loop} (${mode})
- cursorFollow: ${settings.cursorFollow} (origin should ${origin})

Suggested settings object:
${buildRippleSettingsSnippet(settings)}

## Implementation outline
1. Load the photograph as a WebGL texture. Cover-crop it to the canvas display size so it fills without letterboxing or stretching.
2. In the fragment shader, measure distance from u_origin. Spawn N radial waves with phase offsets based on rippleCount. Compute edge/travel radius from origin to the farthest corner so off-center origins still fade cleanly.
3. Along each crest, nudge UVs and add gaussian crest/trough lighting.
4. Drive motion with elapsed time scaled by speed. Loop with mod, or run a one-shot then drain when loop is off.
5. Wire uniforms each frame similarly to:
${buildRippleUniformsSnippet(settings)}

## Deliverable
A self-contained React component with:
- a canvas over a cover-cropped image that fills its frame
- the WebGL ripple effect described above
- a compact control dock: play/pause, loop toggle, cursor-follow toggle, and inline scrubbers for speed / ripples / width
- reduced-motion fallback to the static image

Keep the API small and portable so the same pattern works when the source image changes.`;
}
