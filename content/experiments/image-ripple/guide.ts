import type { RippleSettings } from "./Preview";

export const rippleGuide = {
  tags: ["Motion", "WebGL", "Image treatment"],
  whatYouSee: [
    "I wanted to experiment with a ripple animation sitting on top of an image, and make it scalable enough that you can swap in any photo and see what happens.",
    "In this one you can play with speed, how many ripples go out, and how wide they are, so you get real control over the feel instead of a fixed treatment.",
  ],
  howToBuild: [
    "Change the controls above and these snippets update with them. Copy what you need into your own project.",
    "Drop the photo on a full-screen WebGL quad so the still image is always the base.",
    "In the fragment shader, measure distance from a point (center, or the cursor). Run a few radial waves with offset phases so they do not pile into one thick ring.",
    "Along each crest, nudge the UVs and add a soft bright edge with a darker trough. That is mostly what sells the curve.",
    "Drive motion with elapsed time times speed. Loop with a modulo, or let a single pass drain out when you pause. Clicking the image adds another ripple on top instead of wiping the one already going.",
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
  bandWidth: ${formatNumber(settings.bandWidth)},
  loop: ${settings.loop},
  cursorFollow: ${settings.cursorFollow},
};`;
}

export function buildRippleUniformsSnippet(settings: RippleSettings) {
  const mode = settings.loop ? 1 : 0;
  return `// Global clock keeps running; each click pushes another burst
// (origin + birth time) instead of resetting elapsed.
gl.uniform1f(uRippleCount, ${settings.rippleCount});
gl.uniform1f(uBandWidth, ${formatNumber(settings.bandWidth)});
runtime.elapsed += deltaSeconds * ${formatNumber(settings.speed)};
gl.uniform1f(uTime, runtime.elapsed);
gl.uniform1f(uBurstCount, bursts.length);
// Per burst: origin, birth, mode (${mode} = loop default / 0 = one-shot click)
gl.uniform2f(uOrigins[i], burst.x, burst.y);
gl.uniform1f(uBirths[i], burst.birth);
gl.uniform1f(uModes[i], burst.mode);`;
}

export function buildRippleLlmPrompt(settings: RippleSettings) {
  const mode = settings.loop ? "loop (modulo travel)" : "one-shot then drain out";
  const origin = settings.cursorFollow
    ? "follow the pointer"
    : "stay at the image center (0.5, 0.5)";

  return `Build a reusable image ripple treatment as a drop-in React + WebGL component.

## Goal
Create a center-out water ripple over a still photograph. The photo itself must stay undistorted as a whole. Only a thin band of light bends over it. Swapping the image behind the effect should not require rebuilding the shader.

## Behavior
- Radial wavefronts leave an origin, travel past the frame edges, and fade.
- Waves use staggered phases so they do not stack into one thick ring.
- Around each crest, displace UVs along the radial direction and add soft crest highlight + trough shadow so the band reads as curved water, not a hard circle.
- Support play/pause. Tapping the image should layer a new ripple on top of any that are already running, instead of resetting them.
- Let people drag and drop (or pick) their own image onto the canvas to try the effect on any photo.
- Respect prefers-reduced-motion: skip the canvas and show the still photograph.

## Live settings to match
Use these defaults (expose them as controls or uniforms):
- rippleCount: ${settings.rippleCount}
- speed: ${formatNumber(settings.speed)}
- bandWidth: ${formatNumber(settings.bandWidth)}
- loop: ${settings.loop} (${mode})
- cursorFollow: ${settings.cursorFollow} (origin should ${origin})

Suggested settings object:
${buildRippleSettingsSnippet(settings)}

## Implementation outline
1. Load the photograph as a WebGL texture and draw a full-screen quad.
2. In the fragment shader, support a few concurrent bursts. Each has an origin and birth time. Measure distance from that origin and spawn N radial waves with phase offsets based on rippleCount.
3. Along each crest, nudge UVs and add gaussian crest/trough lighting. Sum displacement across bursts so clicks layer.
4. Drive motion with a global elapsed clock scaled by speed. Clicks add a new burst; do not reset the clock.
5. Wire uniforms each frame similarly to:
${buildRippleUniformsSnippet(settings)}

## Deliverable
A self-contained React component with:
- an aspect-ratio locked canvas over the image
- the WebGL ripple effect described above
- simple controls for rippleCount, speed, bandWidth, loop, and cursorFollow
- reduced-motion fallback to the static image

Keep the API small and portable so the same pattern works when the source image changes.`;
}
