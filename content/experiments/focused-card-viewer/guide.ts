export const focusedCardGuide = {
  tags: ["Interaction design", "Collectibles", "Exploration"],
  whatYouSee: [
    "I’m just playing around with this view — one collectible card on a quiet canvas, nothing else in the way. Drag it, flip it, turn it, and see how the motion feels on its own.",
    "I didn’t want to pick a side, so Yamal, Haaland, and Messi are all here. Tap a thumbnail and root for whoever you want. Drag anywhere to orbit. The bottom-right control flips portrait and landscape. A little damping, idle motion, and studio shine keep the card feeling weighty instead of floaty.",
  ],
  howToBuild: [
    "This is a sandbox, not a drop-in component. I’m using it to feel out orbit, flip, and player switching without product chrome around it.",
    "Thumbnails swap which card is on stage. Drag orbits the physical card; release lets damping settle it.",
    "The rotate control turns the card between portrait and landscape instead of stretching the art.",
    "If reduced motion is on, idle drift eases off and the drag response stays simple.",
  ],
  sectionTitles: {
    howToBuild: "What’s going on",
  },
};
