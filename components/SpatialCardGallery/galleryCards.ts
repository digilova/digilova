import type { SpatialGalleryCard } from "./SpatialCardGallery";

const BUNDLED_CARD_URLS = [
  new URL("./assets/card-01.webp", import.meta.url).href,
  new URL("./assets/card-02.webp", import.meta.url).href,
  new URL("./assets/card-03.webp", import.meta.url).href,
  new URL("./assets/card-04.webp", import.meta.url).href,
  new URL("./assets/card-05.webp", import.meta.url).href,
  new URL("./assets/card-06.webp", import.meta.url).href,
  new URL("./assets/card-07.webp", import.meta.url).href,
  new URL("./assets/card-08.webp", import.meta.url).href,
  new URL("./assets/card-09.webp", import.meta.url).href,
  new URL("./assets/card-10.webp", import.meta.url).href,
  new URL("./assets/card-11.webp", import.meta.url).href,
  new URL("./assets/card-12.webp", import.meta.url).href,
  new URL("./assets/card-13.webp", import.meta.url).href,
  new URL("./assets/card-14.webp", import.meta.url).href,
  new URL("./assets/card-15.webp", import.meta.url).href,
  new URL("./assets/card-16.webp", import.meta.url).href,
  new URL("./assets/card-17.webp", import.meta.url).href,
  new URL("./assets/card-18.webp", import.meta.url).href,
  new URL("./assets/card-19.webp", import.meta.url).href,
  new URL("./assets/card-20.webp", import.meta.url).href,
  new URL("./assets/card-21.webp", import.meta.url).href,
  new URL("./assets/card-22.webp", import.meta.url).href,
  new URL("./assets/card-23.webp", import.meta.url).href,
  new URL("./assets/card-24.webp", import.meta.url).href,
  new URL("./assets/card-25.webp", import.meta.url).href,
  new URL("./assets/card-26.webp", import.meta.url).href,
  new URL("./assets/card-27.webp", import.meta.url).href,
  new URL("./assets/card-28.webp", import.meta.url).href,
  new URL("./assets/card-29.webp", import.meta.url).href,
  new URL("./assets/card-30.webp", import.meta.url).href,
  new URL("./assets/card-31.webp", import.meta.url).href,
  new URL("./assets/card-32.webp", import.meta.url).href,
] as const;

export const ASK_UNK_GALLERY_CARDS: readonly SpatialGalleryCard[] =
  BUNDLED_CARD_URLS.map((src, index) => ({
    id: `ask-unk-card-${String(index + 1).padStart(2, "0")}`,
    src,
    aspectRatio: [0, 1, 3, 15, 24, 25].includes(index)
      ? 640 / 457
      : 457 / 640,
  }));
