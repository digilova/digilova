import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import {
  AnimatedBareCard,
  CardOrbitSnapAnimator,
  useCardOrbitTapSnap,
  useCardPointerTracking,
  type CardOrientation,
} from "./card3d";
import { CardViewerCameraFit } from "./card3d/CardViewerCameraFit";
import {
  CARD_VIEWER_DEFAULT_INSETS,
  type CardViewerFitInsets,
} from "./card3d/cardViewerFit";
import { CARD_PORTRAIT_ASPECT } from "./cardImageAspect";

const MIN_POLAR = Math.PI * 0.22;
const MAX_POLAR = Math.PI * 0.78;
const NEUTRAL_POLAR = (MIN_POLAR + MAX_POLAR) / 2;

function CanvasReadyMarker({ onReady }: { onReady: () => void }) {
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    onReady();
  }, [onReady]);

  return null;
}

/**
 * Allow two-finger / mouse-wheel page scrolling over the canvas.
 * Still let trackpad pinch (wheel + ctrl) and touch pinch zoom the card.
 */
function PinchZoomOnly() {
  const { gl } = useThree();

  useEffect(() => {
    const element = gl.domElement;

    const scrollAncestor = (deltaY: number) => {
      let node: HTMLElement | null = element.parentElement;
      while (node && node !== document.documentElement) {
        const { overflowY } = window.getComputedStyle(node);
        const canScroll =
          (overflowY === "auto" ||
            overflowY === "scroll" ||
            overflowY === "overlay") &&
          node.scrollHeight > node.clientHeight + 1;
        if (canScroll) {
          node.scrollTop += deltaY;
          return;
        }
        node = node.parentElement;
      }
      window.scrollBy(0, deltaY);
    };

    const onWheel = (event: WheelEvent) => {
      // macOS trackpad pinch is delivered as wheel+ctrl; leave that for zoom.
      if (event.ctrlKey || event.metaKey) return;

      // Two-finger scroll / mouse wheel: don't dolly the camera, scroll the page.
      event.stopImmediatePropagation();
      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * window.innerHeight
            : event.deltaY;
      scrollAncestor(delta);
    };

    element.addEventListener("wheel", onWheel, {
      capture: true,
      passive: true,
    });

    return () => {
      element.removeEventListener("wheel", onWheel, {
        capture: true,
      });
    };
  }, [gl]);

  return null;
}

function EmbeddedBareCardScene({
  backImageUrl,
  frontImageUrl,
  orientation,
  aspectRatio,
  fitInsets,
  pointerRef,
  onSceneReady,
}: {
  backImageUrl: string | null;
  frontImageUrl: string | null;
  orientation: CardOrientation;
  aspectRatio: number;
  fitInsets: CardViewerFitInsets;
  pointerRef: ReturnType<typeof useCardPointerTracking>["pointerRef"];
  onSceneReady?: () => void;
}) {
  const interactionRef = useRef({ dragging: false, lastEnd: 0 });
  const { controlsRef, snapTarget, clearSnap, onOrbitStart, onOrbitEnd } = useCardOrbitTapSnap({
    neutralPolar: NEUTRAL_POLAR,
    interactionRef,
  });

  return (
    <>
      <PinchZoomOnly />
      <CardViewerCameraFit
        aspectRatio={aspectRatio}
        orientation={orientation}
        controlsRef={controlsRef}
        fitInsets={fitInsets}
      />
      <Environment preset="city" environmentIntensity={0.88} />
      <ambientLight intensity={0.48} />
      <directionalLight position={[-3.5, 4.5, 5]} intensity={1.25} castShadow />
      <directionalLight position={[3, 2.5, 3]} intensity={0.42} />
      <pointLight position={[0, 1.6, 3.2]} intensity={0.75} color="#ffffff" />
      <AnimatedBareCard
        frontImageUrl={frontImageUrl}
        backImageUrl={backImageUrl}
        interactionRef={interactionRef}
        pointerRef={pointerRef}
        orientation={orientation}
      />
      <ContactShadows position={[0, -2.15, 0]} opacity={0.38} scale={5.5} blur={2.4} far={4.2} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.85}
        minPolarAngle={MIN_POLAR}
        maxPolarAngle={MAX_POLAR}
        onStart={onOrbitStart}
        onEnd={onOrbitEnd}
      />
      <CardOrbitSnapAnimator controlsRef={controlsRef} target={snapTarget} onArrived={clearSnap} />
      {onSceneReady ? <CanvasReadyMarker onReady={onSceneReady} /> : null}
    </>
  );
}

export type BareCard3DViewerProps = {
  frontImageUrl: string | null;
  backImageUrl?: string | null;
  className?: string;
  orientation?: CardOrientation;
  aspectRatio?: number;
  fitInsets?: CardViewerFitInsets;
  opticalCenterOffsetPx?: number;
  revealed?: boolean;
  fadeDurationMs?: number;
  fadeDelayMs?: number;
  fadeEasing?: string;
  onSceneReady?: () => void;
};

export function BareCard3DViewer({
  frontImageUrl,
  backImageUrl = null,
  className = "",
  orientation = "portrait",
  aspectRatio = CARD_PORTRAIT_ASPECT,
  fitInsets = CARD_VIEWER_DEFAULT_INSETS,
  opticalCenterOffsetPx = 0,
  revealed = true,
  fadeDurationMs = 420,
  fadeDelayMs = 0,
  fadeEasing = "cubic-bezier(0.34, 1.3, 0.64, 1)",
  onSceneReady,
}: BareCard3DViewerProps) {
  const { pointerRef, onPointerMove, onPointerLeave } = useCardPointerTracking();
  const shift = opticalCenterOffsetPx;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        // Study: shift the WebGL layer right so the card balances the HTML
        // player/rotate rail. Landing keeps shift at 0 (true geometric center).
        left: shift,
        right: -shift,
        cursor: "grab",
        touchAction: "none",
        opacity: revealed ? 1 : 0,
        transition: `opacity ${fadeDurationMs}ms ${fadeEasing} ${fadeDelayMs}ms`,
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        camera={{ position: [0, 0.05, 7.1], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <EmbeddedBareCardScene
            frontImageUrl={frontImageUrl}
            backImageUrl={backImageUrl}
            orientation={orientation}
            aspectRatio={aspectRatio}
            fitInsets={fitInsets}
            pointerRef={pointerRef}
            onSceneReady={onSceneReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
