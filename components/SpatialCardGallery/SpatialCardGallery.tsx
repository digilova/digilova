"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import styles from "./SpatialCardGallery.module.css";
import { ASK_UNK_GALLERY_CARDS } from "./galleryCards";

export type SpatialGalleryCard = {
  id: string;
  src: string;
  alt?: string;
  aspectRatio?: number;
};

export type SpatialCardGalleryProps = {
  cards?: readonly SpatialGalleryCard[];
  rows?: number | "auto";
  height?: number | string;
  initialMode?: "grid" | "explore";
  background?: string;
  ariaLabel?: string;
  onCardClick?: (card: SpatialGalleryCard, index: number) => void;
  className?: string;
  style?: CSSProperties;
};

type Point = { x: number; y: number };
type GalleryMode = "grid" | "explore";
type Rect = { x: number; y: number; width: number; height: number; opacity: number };
type TransitionState = {
  direction: "to-explore" | "to-grid";
  focusIndex: number;
  progress: number;
  gridScroll: number;
  explorePan: Point;
};

const GRID_CELL = 88;
const GRID_GAP = 12;
const GRID_PADDING = 24;
const REFERENCE_VIEWPORT_WIDTH = 393;
const REFERENCE_VIEWPORT_HEIGHT = 600;
const EXPLORE_CARD_WIDTH = 180;
const EXPLORE_CARD_HEIGHT = 246;
const EXPLORE_COLUMNS = 4;
const EXPLORE_GAP = 24;
const EXPLORE_PADDING = 24;
const PINCH_IN_RATIO = 0.82;
const PINCH_OUT_RATIO = 1.18;
const MORPH_DURATION = 520;
const DRAG_THRESHOLD = 6;
const FRICTION = 0.965;
const MIN_VELOCITY = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toCssSize(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function clientPointToViewportPoint(
  viewport: HTMLDivElement,
  clientX: number,
  clientY: number,
): Point {
  const bounds = viewport.getBoundingClientRect();
  const scaleX = bounds.width / viewport.clientWidth || 1;
  const scaleY = bounds.height / viewport.clientHeight || 1;

  return {
    x: (clientX - bounds.left) / scaleX,
    y: (clientY - bounds.top) / scaleY,
  };
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function shortestWrappedDelta(from: number, to: number, boardSize: number) {
  let delta = to - from;
  if (boardSize <= 0) return delta;
  while (delta > boardSize / 2) delta -= boardSize;
  while (delta < -boardSize / 2) delta += boardSize;
  return delta;
}

function springEase(value: number) {
  return 1 - Math.pow(1 - value, 3) * Math.cos(value * Math.PI * 0.55);
}

function wrapCoordinate(raw: number, boardSize: number, viewportCenter: number) {
  if (boardSize <= 0) return raw;
  return raw - Math.round((raw - viewportCenter) / boardSize) * boardSize;
}

function normalizeCoordinate(value: number, boardSize: number) {
  if (boardSize <= 0) return value;
  return ((value + boardSize / 2) % boardSize + boardSize) % boardSize - boardSize / 2;
}

function positiveModulo(value: number, size: number) {
  if (size <= 0) return value;
  return ((value % size) + size) % size;
}

function focusVisual(screenX: number, screenY: number, width: number, height: number) {
  const layoutWidth = Math.min(width, REFERENCE_VIEWPORT_WIDTH);
  const layoutHeight = Math.min(height, REFERENCE_VIEWPORT_HEIGHT);
  const dx = (screenX - width / 2) / Math.max(layoutWidth * 0.28, 1);
  const dy = (screenY - height / 2) / Math.max(layoutHeight * 0.28, 1);
  const focus = Math.exp(-(dx * dx + dy * dy) * 1.35);
  const emphasis = focus ** 0.72;
  return {
    scale: 0.46 + emphasis * 1.02,
    opacity: 0.42 + emphasis * 0.58,
  };
}

function exploreBoardSize(itemCount: number) {
  const rows = Math.max(1, Math.ceil(itemCount / EXPLORE_COLUMNS));
  return {
    width:
      EXPLORE_PADDING * 2 +
      EXPLORE_COLUMNS * EXPLORE_CARD_WIDTH +
      (EXPLORE_COLUMNS - 1) * EXPLORE_GAP,
    height:
      EXPLORE_PADDING * 2 +
      rows * EXPLORE_CARD_HEIGHT +
      Math.max(0, rows - 1) * EXPLORE_GAP,
  };
}

function explorePlacement(index: number) {
  const column = index % EXPLORE_COLUMNS;
  const row = Math.floor(index / EXPLORE_COLUMNS);
  return {
    x:
      EXPLORE_PADDING +
      EXPLORE_CARD_WIDTH / 2 +
      column * (EXPLORE_CARD_WIDTH + EXPLORE_GAP),
    y:
      EXPLORE_PADDING +
      EXPLORE_CARD_HEIGHT / 2 +
      row * (EXPLORE_CARD_HEIGHT + EXPLORE_GAP),
  };
}

function fitCardInBounds(aspectRatio: number, maxWidth: number, maxHeight: number) {
  const safeAspect = aspectRatio > 0 ? aspectRatio : 3 / 4;
  if (safeAspect >= maxWidth / maxHeight) {
    return { width: maxWidth, height: maxWidth / safeAspect };
  }
  return { width: maxHeight * safeAspect, height: maxHeight };
}

export function SpatialCardGallery({
  cards = ASK_UNK_GALLERY_CARDS,
  rows = 6,
  height = 600,
  initialMode = "grid",
  background = "#4f46e5",
  ariaLabel = "Interactive spatial card gallery",
  onCardClick,
  className,
  style,
}: SpatialCardGalleryProps) {
  const instructionId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<GalleryMode>(initialMode);
  const viewportSizeRef = useRef({ width: 0, height: 0 });
  const gridScrollRef = useRef(0);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, Point>());
  const pinchStartRef = useRef<number | null>(null);
  const pinchTriggeredRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    start: Point;
    gridScroll: number;
    pan: Point;
    moved: boolean;
    targetIndex: number | null;
  } | null>(null);
  const velocityRef = useRef<Point>({ x: 0, y: 0 });
  const sampleRef = useRef({ x: 0, y: 0, time: 0 });
  const inertiaFrameRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const transitionRef = useRef<TransitionState | null>(null);
  const reduceMotionRef = useRef(false);

  const [mode, setMode] = useState<GalleryMode>(initialMode);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [gridScroll, setGridScroll] = useState(0);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [measuredAspects, setMeasuredAspects] = useState<Record<string, number>>({});

  const exploreSize = useMemo(() => exploreBoardSize(cards.length), [cards.length]);
  const effectiveRows = useMemo(() => {
    if (typeof rows === "number") {
      return clamp(Math.floor(rows), 1, Math.max(1, cards.length));
    }
    if (cards.length <= 1) return 1;

    const width = Math.max(1, viewportSize.width - GRID_PADDING * 2);
    const availableHeight = Math.max(1, viewportSize.height - GRID_PADDING * 2);
    const balancedRows = Math.round(
      Math.sqrt(cards.length * (availableHeight / width)),
    );
    return clamp(balancedRows, 2, Math.min(8, cards.length));
  }, [cards.length, rows, viewportSize.height, viewportSize.width]);

  const gridMetrics = useMemo(() => {
    const availableHeight = Math.max(1, viewportSize.height - GRID_PADDING * 2);
    const layoutWidth = Math.min(
      viewportSize.width,
      REFERENCE_VIEWPORT_WIDTH,
    );
    const availableWidth = Math.max(1, layoutWidth - GRID_PADDING * 2);
    const columns = Math.max(1, Math.ceil(cards.length / effectiveRows));
    const naturalHeight =
      effectiveRows * GRID_CELL + Math.max(0, effectiveRows - 1) * GRID_GAP;
    const naturalWidth =
      columns * GRID_CELL + Math.max(0, columns - 1) * GRID_GAP;
    const scale =
      rows === "auto"
        ? Math.min(1, availableHeight / naturalHeight, availableWidth / naturalWidth)
        : 1;
    const cell = GRID_CELL * scale;
    const gap = GRID_GAP * scale;
    const contentWidth =
      GRID_PADDING * 2 + columns * cell + Math.max(0, columns - 1) * gap;
    const contentHeight =
      effectiveRows * cell + Math.max(0, effectiveRows - 1) * gap;
    return {
      cell,
      gap,
      columns,
      contentWidth,
      contentHeight,
      left: Math.max(0, (viewportSize.width - layoutWidth) / 2),
      top: Math.max(0, (viewportSize.height - contentHeight) / 2),
      maxScroll: Math.max(0, contentWidth - layoutWidth),
    };
  }, [
    cards.length,
    effectiveRows,
    rows,
    viewportSize.height,
    viewportSize.width,
  ]);

  const stopInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
    if (focusFrameRef.current !== null) {
      cancelAnimationFrame(focusFrameRef.current);
      focusFrameRef.current = null;
    }
  }, []);

  const commitPan = useCallback(
    (next: Point) => {
      const normalized = {
        x: normalizeCoordinate(next.x, exploreSize.width),
        y: normalizeCoordinate(next.y, exploreSize.height),
      };
      panRef.current = normalized;
      setPan(normalized);
    },
    [exploreSize.height, exploreSize.width],
  );

  const commitGridScroll = useCallback(
    (next: number) => {
      gridScrollRef.current = next;
      setGridScroll(next);
    },
    [],
  );

  const getGridRect = useCallback(
    (
      index: number,
      scroll: number,
      slotOverride?: number,
      nearest = false,
    ): Rect => {
      let slot = slotOverride ?? index;
      if (nearest && cards.length > 0) {
        const targetColumn =
          (scroll +
            viewportSize.width / 2 -
            gridMetrics.left -
            GRID_PADDING -
            gridMetrics.cell / 2) /
          (gridMetrics.cell + gridMetrics.gap);
        const targetSlot = targetColumn * effectiveRows;
        slot =
          index +
          Math.round((targetSlot - index) / cards.length) * cards.length;
      }
      const column = Math.floor(slot / effectiveRows);
      const row = positiveModulo(slot, effectiveRows);
      const center =
        gridMetrics.left +
        GRID_PADDING +
        column * (gridMetrics.cell + gridMetrics.gap) +
        gridMetrics.cell / 2 -
        scroll;
      return {
        x: center - gridMetrics.cell / 2,
        y: gridMetrics.top + row * (gridMetrics.cell + gridMetrics.gap),
        width: gridMetrics.cell,
        height: gridMetrics.cell,
        opacity: 1,
      };
    },
    [
      effectiveRows,
      gridMetrics.cell,
      gridMetrics.gap,
      gridMetrics.left,
      gridMetrics.top,
      cards.length,
      viewportSize.width,
    ],
  );

  const getExploreRect = useCallback(
    (index: number, targetPan: Point): Rect => {
      const placement = explorePlacement(index);
      const screenX = wrapCoordinate(
        placement.x + targetPan.x,
        exploreSize.width,
        viewportSize.width / 2,
      );
      const screenY = wrapCoordinate(
        placement.y + targetPan.y,
        exploreSize.height,
        viewportSize.height / 2,
      );
      const visual = focusVisual(
        screenX,
        screenY,
        viewportSize.width,
        viewportSize.height,
      );
      const card = cards[index];
      const fitted = fitCardInBounds(
        card?.aspectRatio ?? measuredAspects[card?.id ?? ""] ?? 3 / 4,
        EXPLORE_CARD_WIDTH,
        EXPLORE_CARD_HEIGHT,
      );
      const width = fitted.width * visual.scale;
      const rectHeight = fitted.height * visual.scale;
      return {
        x: screenX - width / 2,
        y: screenY - rectHeight / 2,
        width,
        height: rectHeight,
        opacity: visual.opacity,
      };
    },
    [
      cards,
      exploreSize.height,
      exploreSize.width,
      measuredAspects,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const nearestGridIndex = useCallback(
    (point: Point) => {
      if (cards.length === 0) return 0;
      const worldX =
        point.x +
        gridScrollRef.current -
        gridMetrics.left -
        GRID_PADDING;
      const worldY = point.y - gridMetrics.top;
      const column = Math.round(
        (worldX - gridMetrics.cell / 2) /
          (gridMetrics.cell + gridMetrics.gap),
      );
      const row = clamp(
        Math.round((worldY - gridMetrics.cell / 2) / (gridMetrics.cell + gridMetrics.gap)),
        0,
        effectiveRows - 1,
      );
      return positiveModulo(column * effectiveRows + row, cards.length);
    },
    [
      cards.length,
      gridMetrics.cell,
      gridMetrics.gap,
      gridMetrics.left,
      gridMetrics.top,
      effectiveRows,
    ],
  );

  const nearestExploreIndex = useCallback(
    (point: Point, targetPan = panRef.current) => {
      if (cards.length === 0) return 0;
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((_, index) => {
        const rect = getExploreRect(index, targetPan);
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        const nextDistance = Math.hypot(point.x - centerX, point.y - centerY);
        if (nextDistance < bestDistance) {
          bestDistance = nextDistance;
          bestIndex = index;
        }
      });

      return bestIndex;
    },
    [cards, getExploreRect],
  );

  const centeredPanForIndex = useCallback(
    (index: number) => {
      const placement = explorePlacement(index);
      return {
        x: viewportSize.width / 2 - placement.x,
        y: viewportSize.height / 2 - placement.y,
      };
    },
    [viewportSize.height, viewportSize.width],
  );

  const gridScrollForIndex = useCallback(
    (index: number) => {
      if (cards.length === 0) return 0;
      const targetColumn =
        (gridScrollRef.current +
          viewportSize.width / 2 -
          gridMetrics.left -
          GRID_PADDING -
          gridMetrics.cell / 2) /
        (gridMetrics.cell + gridMetrics.gap);
      const targetSlot = targetColumn * effectiveRows;
      const slot =
        index +
        Math.round((targetSlot - index) / cards.length) * cards.length;
      const column = Math.floor(slot / effectiveRows);
      const cardCenter =
        gridMetrics.left +
        GRID_PADDING +
        column * (gridMetrics.cell + gridMetrics.gap) +
        gridMetrics.cell / 2;
      return cardCenter - viewportSize.width / 2;
    },
    [
      gridMetrics.cell,
      gridMetrics.gap,
      gridMetrics.left,
      effectiveRows,
      cards.length,
      viewportSize.width,
    ],
  );

  const animatePanToIndex = useCallback(
    (index: number) => {
      stopInertia();
      const from = { ...panRef.current };
      const baseTarget = centeredPanForIndex(index);
      const target = {
        x:
          baseTarget.x +
          Math.round((from.x - baseTarget.x) / exploreSize.width) *
            exploreSize.width,
        y:
          baseTarget.y +
          Math.round((from.y - baseTarget.y) / exploreSize.height) *
            exploreSize.height,
      };
      const delta = {
        x: shortestWrappedDelta(from.x, target.x, exploreSize.width),
        y: shortestWrappedDelta(from.y, target.y, exploreSize.height),
      };
      const startedAt = performance.now();

      const tick = (now: number) => {
        const elapsed = clamp((now - startedAt) / 480, 0, 1);
        const eased = reduceMotionRef.current ? 1 : springEase(elapsed);
        commitPan({
          x: from.x + delta.x * eased,
          y: from.y + delta.y * eased,
        });
        if (elapsed < 1 && !reduceMotionRef.current) {
          focusFrameRef.current = requestAnimationFrame(tick);
        } else {
          focusFrameRef.current = null;
        }
      };

      focusFrameRef.current = requestAnimationFrame(tick);
    },
    [
      centeredPanForIndex,
      commitPan,
      exploreSize.height,
      exploreSize.width,
      stopInertia,
    ],
  );

  const finishTransition = useCallback(
    (state: TransitionState) => {
      transitionFrameRef.current = null;
      transitionRef.current = null;
      setTransition(null);

      if (state.direction === "to-explore") {
        modeRef.current = "explore";
        setMode("explore");
        commitPan(state.explorePan);
      } else {
        modeRef.current = "grid";
        setMode("grid");
        commitGridScroll(state.gridScroll);
      }
    },
    [commitGridScroll, commitPan],
  );

  const startTransition = useCallback(
    (
      direction: TransitionState["direction"],
      focusIndex: number,
      animate = true,
    ) => {
      if (transitionRef.current || cards.length === 0) return;
      stopInertia();
      const shouldAnimate = animate && !reduceMotionRef.current;

      const state: TransitionState = {
        direction,
        focusIndex,
        progress: direction === "to-explore" ? 0 : 1,
        gridScroll:
          direction === "to-explore"
            ? gridScrollRef.current
            : gridScrollForIndex(focusIndex),
        explorePan:
          direction === "to-explore"
            ? centeredPanForIndex(focusIndex)
            : panRef.current,
      };

      if (!shouldAnimate) {
        finishTransition({
          ...state,
          progress: direction === "to-explore" ? 1 : 0,
        });
        return;
      }

      transitionRef.current = state;
      setTransition(state);
      const startedAt = performance.now();

      const tick = (now: number) => {
        if (!transitionRef.current) return;
        const elapsed = clamp((now - startedAt) / MORPH_DURATION, 0, 1);
        const eased = easeOutCubic(elapsed);
        const progress = direction === "to-explore" ? eased : 1 - eased;
        const next = { ...transitionRef.current, progress };
        transitionRef.current = next;
        setTransition(next);

        if (elapsed < 1) {
          transitionFrameRef.current = requestAnimationFrame(tick);
        } else {
          finishTransition(next);
        }
      };

      transitionFrameRef.current = requestAnimationFrame(tick);
    },
    [
      cards.length,
      centeredPanForIndex,
      finishTransition,
      gridScrollForIndex,
      stopInertia,
    ],
  );

  const enterExploreAt = useCallback(
    (point: Point, animate = true) => {
      if (modeRef.current !== "grid") return;
      startTransition("to-explore", nearestGridIndex(point), animate);
    },
    [nearestGridIndex, startTransition],
  );

  const returnToGridAt = useCallback(
    (point: Point, animate = true) => {
      if (modeRef.current !== "explore") return;
      startTransition("to-grid", nearestExploreIndex(point), animate);
    },
    [nearestExploreIndex, startTransition],
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      const width = viewport.clientWidth;
      const measuredHeight = viewport.clientHeight;
      if (width <= 0 || measuredHeight <= 0) return;
      viewportSizeRef.current = { width, height: measuredHeight };
      setViewportSize({ width, height: measuredHeight });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    commitGridScroll(gridScrollRef.current);
  }, [commitGridScroll]);

  useEffect(() => {
    if (initialMode !== "explore" || cards.length === 0) return;
    const frame = requestAnimationFrame(() => {
      const initialPan = centeredPanForIndex(0);
      panRef.current = initialPan;
      setPan(initialPan);
    });
    return () => cancelAnimationFrame(frame);
  }, [cards.length, centeredPanForIndex, initialMode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reduceMotionRef.current = media.matches;
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      const point = clientPointToViewportPoint(
        viewport,
        event.clientX,
        event.clientY,
      );

      if (event.ctrlKey || event.metaKey) {
        if (modeRef.current === "grid" && event.deltaY < 0) {
          event.preventDefault();
          enterExploreAt(point);
        } else if (modeRef.current === "explore" && event.deltaY > 0) {
          event.preventDefault();
          returnToGridAt(point);
        }
        return;
      }

      if (modeRef.current === "grid" && gridMetrics.maxScroll > 0) {
        event.preventDefault();
        commitGridScroll(
          gridScrollRef.current +
            (Math.abs(event.deltaX) > Math.abs(event.deltaY)
              ? event.deltaX
              : event.deltaY),
        );
      }
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [
    commitGridScroll,
    enterExploreAt,
    gridMetrics.maxScroll,
    returnToGridAt,
  ]);

  useEffect(
    () => () => {
      stopInertia();
      if (transitionFrameRef.current !== null) {
        cancelAnimationFrame(transitionFrameRef.current);
      }
    },
    [stopInertia],
  );

  function startInertia() {
    stopInertia();
    let velocity = { ...velocityRef.current };

    const tick = () => {
      velocity = { x: velocity.x * FRICTION, y: velocity.y * FRICTION };
      if (
        Math.abs(velocity.x) < MIN_VELOCITY &&
        Math.abs(velocity.y) < MIN_VELOCITY
      ) {
        inertiaFrameRef.current = null;
        return;
      }
      commitPan({
        x: panRef.current.x + velocity.x,
        y: panRef.current.y + velocity.y,
      });
      inertiaFrameRef.current = requestAnimationFrame(tick);
    };

    inertiaFrameRef.current = requestAnimationFrame(tick);
  }

  function resetSinglePointer(
    pointerId: number,
    point: Point,
    targetIndex: number | null,
  ) {
    dragRef.current = {
      pointerId,
      start: point,
      gridScroll: gridScrollRef.current,
      pan: panRef.current,
      moved: false,
      targetIndex,
    };
    sampleRef.current = {
      x: point.x,
      y: point.y,
      time: performance.now(),
    };
    velocityRef.current = { x: 0, y: 0 };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (transitionRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.focus({ preventScroll: true });
    viewport.setPointerCapture(event.pointerId);
    stopInertia();

    const point = clientPointToViewportPoint(
      viewport,
      event.clientX,
      event.clientY,
    );
    const cardElement =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-spatial-gallery-card]")
        : null;
    const parsedTargetIndex = Number(cardElement?.dataset.cardIndex);
    const targetIndex =
      cardElement && Number.isInteger(parsedTargetIndex)
        ? parsedTargetIndex
        : null;
    pointersRef.current.set(event.pointerId, point);

    if (pointersRef.current.size === 2) {
      const points = [...pointersRef.current.values()];
      pinchStartRef.current = distance(points[0], points[1]);
      pinchTriggeredRef.current = false;
      dragRef.current = null;
      setDragging(false);
      return;
    }

    resetSinglePointer(event.pointerId, point, targetIndex);
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId) || transitionRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const point = clientPointToViewportPoint(
      viewport,
      event.clientX,
      event.clientY,
    );
    pointersRef.current.set(event.pointerId, point);

    if (pointersRef.current.size === 2) {
      const points = [...pointersRef.current.values()];
      const pinchDistance = distance(points[0], points[1]);
      const startDistance = pinchStartRef.current ?? pinchDistance;
      pinchStartRef.current = startDistance;
      const ratio = pinchDistance / Math.max(1, startDistance);
      const center = midpoint(points[0], points[1]);

      if (!pinchTriggeredRef.current) {
        if (modeRef.current === "grid" && ratio > PINCH_OUT_RATIO) {
          pinchTriggeredRef.current = true;
          enterExploreAt(center);
        } else if (modeRef.current === "explore" && ratio < PINCH_IN_RATIO) {
          pinchTriggeredRef.current = true;
          returnToGridAt(center);
        }
      }
      event.preventDefault();
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      drag.moved = true;
    }

    if (modeRef.current === "grid") {
      commitGridScroll(drag.gridScroll - dx - dy);
    } else {
      commitPan({ x: drag.pan.x + dx, y: drag.pan.y + dy });
      const now = performance.now();
      const sample = sampleRef.current;
      const elapsed = Math.max(1, now - sample.time);
      velocityRef.current = {
        x: ((point.x - sample.x) / elapsed) * 16,
        y: ((point.y - sample.y) / elapsed) * 16,
      };
      sampleRef.current = { x: point.x, y: point.y, time: now };
    }
    event.preventDefault();
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const releasePoint = viewport
      ? clientPointToViewportPoint(
          viewport,
          event.clientX,
          event.clientY,
        )
      : null;
    const completedDrag = dragRef.current;
    pointersRef.current.delete(event.pointerId);
    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (pointersRef.current.size === 0) {
      const shouldGlide =
        modeRef.current === "explore" &&
        completedDrag?.moved &&
        !transitionRef.current;
      dragRef.current = null;
      pinchStartRef.current = null;
      pinchTriggeredRef.current = false;
      setDragging(false);
      if (shouldGlide) {
        startInertia();
      } else if (!transitionRef.current && releasePoint && !completedDrag?.moved) {
        if (modeRef.current === "grid") {
          if (completedDrag?.targetIndex != null) {
            startTransition(
              "to-explore",
              completedDrag.targetIndex,
            );
          }
        } else {
          const hitIndex = completedDrag?.targetIndex ?? null;
          if (hitIndex !== null) {
            const viewportCenter = {
              x: viewportSizeRef.current.width / 2,
              y: viewportSizeRef.current.height / 2,
            };
            const focusedIndex = nearestExploreIndex(viewportCenter);
            const hitRect = getExploreRect(hitIndex, panRef.current);
            const hitCenter = {
              x: hitRect.x + hitRect.width / 2,
              y: hitRect.y + hitRect.height / 2,
            };
            const nearCenter =
              hitIndex === focusedIndex &&
              Math.hypot(
                hitCenter.x - viewportCenter.x,
                hitCenter.y - viewportCenter.y,
              ) <
                Math.min(
                  viewportSizeRef.current.width,
                  viewportSizeRef.current.height,
                ) *
                  0.18;

            if (nearCenter) {
              onCardClick?.(cards[hitIndex], hitIndex);
            } else {
              animatePanToIndex(hitIndex);
            }
          } else {
            returnToGridAt(releasePoint);
          }
        }
      }
      return;
    }

    if (pointersRef.current.size === 1 && !transitionRef.current) {
      const [pointerId, point] = [...pointersRef.current.entries()][0];
      pinchStartRef.current = null;
      pinchTriggeredRef.current = false;
      resetSinglePointer(pointerId, point, null);
      if (dragRef.current) dragRef.current.moved = true;
      setDragging(true);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const center = {
      x: viewportSizeRef.current.width / 2,
      y: viewportSizeRef.current.height / 2,
    };

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      enterExploreAt(center, false);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      returnToGridAt(center, false);
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      stopInertia();
      if (modeRef.current === "explore") {
        const next = centeredPanForIndex(0);
        commitPan(next);
      } else {
        commitGridScroll(0);
      }
      return;
    }

    const step = 32;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }
    event.preventDefault();

    if (modeRef.current === "grid") {
      const delta =
        event.key === "ArrowLeft" || event.key === "ArrowUp" ? -step : step;
      commitGridScroll(gridScrollRef.current + delta);
      return;
    }

    const delta = {
      x:
        event.key === "ArrowLeft"
          ? step
          : event.key === "ArrowRight"
            ? -step
            : 0,
      y:
        event.key === "ArrowUp"
          ? step
          : event.key === "ArrowDown"
            ? -step
            : 0,
    };
    commitPan({ x: panRef.current.x + delta.x, y: panRef.current.y + delta.y });
  }

  const viewportStyle: CSSProperties = {
    height: toCssSize(height),
    background,
    ...style,
  };

  const visibleMode = transition ? null : mode;
  const layerClassName = transition
    ? styles.morphLayer
    : mode === "grid"
      ? styles.gridLayer
      : styles.exploreLayer;
  const cardClassName = transition
    ? styles.morphCard
    : mode === "grid"
      ? styles.gridCard
      : styles.exploreCard;
  const gridStep = gridMetrics.cell + gridMetrics.gap;
  const firstGridColumn =
    Math.floor(
      (gridScroll - gridMetrics.left - GRID_PADDING) /
        Math.max(gridStep, 1),
    ) - 1;
  const visibleGridColumns =
    Math.ceil(viewportSize.width / Math.max(gridStep, 1)) + 3;
  const renderedCards =
    cards.length === 0
      ? []
      : !transition && mode === "grid"
        ? Array.from(
            { length: visibleGridColumns * effectiveRows },
            (_, offset) => {
              const column =
                firstGridColumn + Math.floor(offset / effectiveRows);
              const row = offset % effectiveRows;
              const slot = column * effectiveRows + row;
              const index = positiveModulo(slot, cards.length);
              return { card: cards[index], index, slot };
            },
          )
        : cards.map((card, index) => ({
            card,
            index,
            slot: undefined,
          }));

  return (
    <div
      ref={viewportRef}
      className={[
        styles.viewport,
        visibleMode === "explore" ? styles.exploreCursor : "",
        dragging ? styles.dragging : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={viewportStyle}
      role="region"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-describedby={instructionId}
      data-gallery-mode={transition ? "transition" : mode}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <span id={instructionId} className={styles.srOnly}>
        Pinch out to enter the free-pan card field. Pinch in to return to the
        compact grid. Tap empty space, rather than a background card, to return
        to the grid. Drag to move cards. Use plus and minus to switch views,
        arrow keys to pan, and zero to reset.
      </span>
      <span className={styles.srOnly} aria-live="polite">
        {mode === "grid" ? "Compact grid view" : "Free-pan explore view"}
      </span>

      <div
        className={layerClassName}
        data-spatial-gallery-grid={visibleMode === "grid" ? "" : undefined}
        data-spatial-gallery-explore={visibleMode === "explore" ? "" : undefined}
        aria-hidden={transition ? true : undefined}
      >
        {renderedCards.map(({ card, index, slot }) => {
          const gridRect = getGridRect(
            index,
            transition?.gridScroll ?? gridScroll,
            slot,
            Boolean(transition),
          );
          const exploreRect = getExploreRect(
            index,
            transition?.explorePan ?? pan,
          );
          const rect = transition
            ? {
                x: lerp(gridRect.x, exploreRect.x, transition.progress),
                y: lerp(gridRect.y, exploreRect.y, transition.progress),
                width: lerp(
                  gridRect.width,
                  exploreRect.width,
                  transition.progress,
                ),
                height: lerp(
                  gridRect.height,
                  exploreRect.height,
                  transition.progress,
                ),
                opacity: lerp(
                  gridRect.opacity,
                  exploreRect.opacity,
                  transition.progress,
                ),
              }
            : mode === "grid"
              ? gridRect
              : exploreRect;
          const column = Math.floor(index / effectiveRows);
          const row = index % effectiveRows;
          const delay = Math.min(column + row, 12) * 32;

          return (
            <div
              className={cardClassName}
              key={slot === undefined ? card.id : `${card.id}-slot-${slot}`}
              data-spatial-gallery-card
              data-card-index={index}
              style={
                {
                  left: rect.x,
                  top: rect.y,
                  width: rect.width,
                  height: rect.height,
                  opacity: rect.opacity,
                  borderRadius: transition
                    ? lerp(8, 16, transition.progress)
                    : undefined,
                  "--spatial-gallery-delay": `${delay}ms`,
                } as CSSProperties
              }
            >
              <img
                src={card.src}
                alt={transition ? "" : card.alt ?? ""}
                draggable={false}
                loading="eager"
                decoding="async"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
                  const nextAspect = image.naturalWidth / image.naturalHeight;
                  setMeasuredAspects((current) =>
                    current[card.id] === nextAspect
                      ? current
                      : { ...current, [card.id]: nextAspect },
                  );
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
