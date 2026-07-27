"use client";

/* eslint-disable @next/next/no-img-element -- the native image is the fallback and WebGL texture source. */
import { useEffect, useId, useRef, useState, type CSSProperties, type DragEvent } from "react";
import backgroundImage from "./assets/azulejos.webp";
import styles from "./Preview.module.css";

type DetailControl = "ripples" | "speed" | "width";

export type RippleSettings = {
  rippleCount: number;
  speed: number;
  bandWidth: number;
  loop: boolean;
  cursorFollow: boolean;
};

const CONTROL_RANGES = {
  ripples: { min: 1, max: 5, step: 1 },
  speed: { min: 0.5, max: 2, step: 0.05 },
  width: { min: 0.75, max: 5, step: 0.01 },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_uv;
  varying vec2 v_uv;

  void main() {
    v_uv = a_uv;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform sampler2D u_texture;
  uniform float u_aspect;
  uniform float u_band_width;
  uniform float u_mode;
  uniform float u_ripple_count;
  uniform float u_active;
  uniform float u_transition_time;
  uniform float u_time;
  uniform vec2 u_origin;
  varying vec2 v_uv;

  float gaussian(float value, float center, float width) {
    float position = (value - center) / width;
    return exp(-(position * position));
  }

  void main() {
    vec2 point = v_uv - u_origin;
    point.x *= u_aspect;

    float radius = length(point);
    vec2 direction = radius > 0.0001 ? point / radius : vec2(0.0);
    vec2 uvDirection = vec2(direction.x / u_aspect, direction.y);

    vec2 toCorner00 = vec2((0.0 - u_origin.x) * u_aspect, 0.0 - u_origin.y);
    vec2 toCorner10 = vec2((1.0 - u_origin.x) * u_aspect, 0.0 - u_origin.y);
    vec2 toCorner01 = vec2((0.0 - u_origin.x) * u_aspect, 1.0 - u_origin.y);
    vec2 toCorner11 = vec2((1.0 - u_origin.x) * u_aspect, 1.0 - u_origin.y);
    float edgeRadius = max(
      max(length(toCorner00), length(toCorner10)),
      max(length(toCorner01), length(toCorner11))
    );
    float travelRadius = edgeRadius * 1.16;
    float cycle = 3.45;
    float displacement = 0.0;
    float lighting = 0.0;

    for (int wave = 0; wave < 5; wave++) {
      float enabled =
        1.0 - step(u_ripple_count, float(wave) + 0.5);
      float phaseOffset =
        float(wave) * travelRadius / max(u_ripple_count, 1.0);
      float loopRadius = mod(
        (u_time * travelRadius / cycle) + phaseOffset,
        travelRadius
      );
      float oneShotRadius =
        (u_time * travelRadius / cycle) -
        (float(wave) * travelRadius * 0.18);
      float drainStartRadius = mod(
        (u_transition_time * travelRadius / cycle) + phaseOffset,
        travelRadius
      );
      float drainRadius =
        drainStartRadius +
        max(u_time - u_transition_time, 0.0) * travelRadius / cycle;
      float waveRadius = oneShotRadius;
      if (u_mode > 0.5) waveRadius = loopRadius;
      if (u_mode > 1.5) waveRadius = drainRadius;

      float distanceToCrest = radius - waveRadius;
      float bandWidth = u_band_width * mix(
        0.0125,
        0.016,
        clamp(waveRadius / max(edgeRadius, 0.0001), 0.0, 1.0)
      );
      float profilePosition = distanceToCrest / bandWidth;
      float waveProfile =
        profilePosition * exp(-0.5 * profilePosition * profilePosition);

      float birthFade = smoothstep(0.0, edgeRadius * 0.035, waveRadius);
      float exitFade =
        1.0 - smoothstep(edgeRadius, travelRadius, waveRadius);
      float visibility =
        birthFade *
        exitFade *
        enabled *
        u_active *
        step(0.0, waveRadius);
      float strength = mix(
        0.028,
        0.017,
        clamp(waveRadius / max(edgeRadius, 0.0001), 0.0, 1.0)
      );

      displacement += waveProfile * strength * visibility;

      float brightCrest = gaussian(profilePosition, -0.22, 0.34);
      float darkTrough = gaussian(profilePosition, 0.58, 0.58);
      lighting +=
        (brightCrest * 0.09 - darkTrough * 0.052) * visibility;
    }

    vec2 sampleUv = clamp(
      v_uv - uvDirection * displacement,
      vec2(0.001),
      vec2(0.999)
    );
    vec4 color = texture2D(u_texture, sampleUv);
    color.rgb += lighting;
    gl_FragColor = color;
  }
`;


const defaultImageSrc = backgroundImage.src;
const defaultImageWidth = backgroundImage.width;
const defaultImageHeight = backgroundImage.height;

function coverCropImage(
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    return canvas;
  }

  // Slight overscan so rounded clips and subpixels never flash empty edges.
  const scale =
    Math.max(
      targetWidth / image.naturalWidth,
      targetHeight / image.naturalHeight,
    ) * 1.03;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(
    image,
    (targetWidth - drawWidth) / 2,
    (targetHeight - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  return canvas;
}

function textureSizeForDisplay(displayWidth: number, displayHeight: number) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let width = Math.max(1, Math.round(displayWidth * pixelRatio));
  let height = Math.max(1, Math.round(displayHeight * pixelRatio));
  const maxSide = 1536;
  const fit = Math.min(1, maxSide / Math.max(width, height));
  width = Math.max(1, Math.round(width * fit));
  height = Math.max(1, Math.round(height * fit));
  return { width, height };
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export default function Preview({
  className,
  onSettingsChange,
}: {
  className?: string;
  onSettingsChange?: (settings: RippleSettings) => void;
}) {
  const controlsId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlDockRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const firstControlRef = useRef<HTMLButtonElement>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);
  const parameterRefs = useRef<Partial<Record<DetailControl, HTMLButtonElement>>>(
    {},
  );
  const runtimeRef = useRef({
    elapsed: 0,
    lastFrame: 0,
    playing: true,
  });
  const settingsRef = useRef({
    active: true,
    drainStart: 0,
    mode: 1,
    originX: 0.5,
    originY: 0.5,
    rippleCount: 3,
    rippleWidth: 1.35,
    speed: 1,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [cursorFollow, setCursorFollow] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [rippleCount, setRippleCount] = useState(3);
  const [rippleWidth, setRippleWidth] = useState(1.35);
  const [speed, setSpeed] = useState(1);
  const [detailControl, setDetailControl] =
    useState<DetailControl | null>(null);
  const [imageSrc, setImageSrc] = useState(defaultImageSrc);
  const [dropActive, setDropActive] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImageRef = useRef<(source: HTMLImageElement) => void>(() => {});
  const resetToDefaultImageRef = useRef(() => {});

  resetToDefaultImageRef.current = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageSrc(defaultImageSrc);
    const seed = new window.Image();
    seed.decoding = "async";
    seed.onload = () => {
      uploadImageRef.current(seed);
    };
    seed.src = defaultImageSrc;
  };

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        resetToDefaultImageRef.current();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    settingsRef.current = {
      ...settingsRef.current,
      rippleCount,
      rippleWidth,
      speed,
    };
  }, [rippleCount, rippleWidth, speed]);

  useEffect(() => {
    onSettingsChange?.({
      rippleCount,
      speed,
      bandWidth: rippleWidth,
      loop: loopEnabled,
      cursorFollow,
    });
  }, [
    cursorFollow,
    loopEnabled,
    onSettingsChange,
    rippleCount,
    rippleWidth,
    speed,
  ]);

  useEffect(() => {
    if (!menuOpen) return;
    window.requestAnimationFrame(() => firstControlRef.current?.focus());
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !detailControl) return;
    window.requestAnimationFrame(() => scrubberRef.current?.focus());
  }, [detailControl, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !controlDockRef.current?.contains(event.target)
      ) {
        setMenuOpen(false);
        setDetailControl(null);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [menuOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (!canvas || reducedMotion.matches) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource,
    );
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();
    if (!program || !buffer || !texture) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const uvLocation = gl.getAttribLocation(program, "a_uv");
    const aspectLocation = gl.getUniformLocation(program, "u_aspect");
    const bandWidthLocation = gl.getUniformLocation(program, "u_band_width");
    const modeLocation = gl.getUniformLocation(program, "u_mode");
    const rippleCountLocation = gl.getUniformLocation(
      program,
      "u_ripple_count",
    );
    const activeLocation = gl.getUniformLocation(program, "u_active");
    const transitionTimeLocation = gl.getUniformLocation(
      program,
      "u_transition_time",
    );
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const originLocation = gl.getUniformLocation(program, "u_origin");
    const textureLocation = gl.getUniformLocation(program, "u_texture");
    if (
      positionLocation < 0 ||
      uvLocation < 0 ||
      !aspectLocation ||
      !bandWidthLocation ||
      !modeLocation ||
      !rippleCountLocation ||
      !activeLocation ||
      !transitionTimeLocation ||
      !timeLocation ||
      !originLocation ||
      !textureLocation
    ) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1,
        0, 1, 1, 1, 1,
      ]),
      gl.STATIC_DRAW,
    );

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    let sourceImage: HTMLImageElement | null = null;
    let lastTextureKey = "";
    let animationFrame = 0;
    let disposed = false;
    let textureReady = false;

    const uploadCovered = (source: HTMLImageElement) => {
      sourceImage = source;
      const displayWidth = Math.max(1, Math.round(canvas.clientWidth));
      const displayHeight = Math.max(1, Math.round(canvas.clientHeight));
      const { width, height } = textureSizeForDisplay(
        displayWidth,
        displayHeight,
      );
      const key = `${source.src}|${width}x${height}`;
      if (key === lastTextureKey && textureReady) return;
      lastTextureKey = key;
      const covered = coverCropImage(source, width, height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        covered,
      );
      textureReady = true;
    };

    uploadImageRef.current = uploadCovered;

    const render = (time: number) => {
      if (disposed) return;
      const runtime = runtimeRef.current;
      const settings = settingsRef.current;
      if (!runtime.lastFrame) runtime.lastFrame = time;

      const elapsedSinceFrame = Math.min(
        (time - runtime.lastFrame) / 1000,
        0.05,
      );
      runtime.lastFrame = time;
      if (runtime.playing) {
        runtime.elapsed += elapsedSinceFrame * settings.speed;
      }

      const oneShotDuration =
        3.45 * (1 + 0.18 * (settings.rippleCount - 1)) + 0.2;
      const drainComplete =
        settings.mode === 2 &&
        runtime.elapsed - settings.drainStart > 3.45;
      const oneShotComplete =
        settings.mode === 0 && runtime.elapsed > oneShotDuration;
      if (runtime.playing && (drainComplete || oneShotComplete)) {
        runtime.playing = false;
        settingsRef.current.active = false;
        settingsRef.current.mode = 0;
        setPlaying(false);
      }

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.max(1, Math.round(canvas.clientWidth));
      const displayHeight = Math.max(1, Math.round(canvas.clientHeight));
      const renderWidth = Math.round(displayWidth * pixelRatio);
      const renderHeight = Math.round(displayHeight * pixelRatio);

      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
        gl.viewport(0, 0, renderWidth, renderHeight);
        if (sourceImage) {
          uploadCovered(sourceImage);
        }
      }

      if (!textureReady) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        animationFrame = window.requestAnimationFrame(render);
        return;
      }

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        4 * Float32Array.BYTES_PER_ELEMENT,
        0,
      );
      gl.enableVertexAttribArray(uvLocation);
      gl.vertexAttribPointer(
        uvLocation,
        2,
        gl.FLOAT,
        false,
        4 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT,
      );
      gl.uniform1f(aspectLocation, displayWidth / displayHeight);
      gl.uniform1f(bandWidthLocation, settings.rippleWidth);
      gl.uniform1f(modeLocation, settings.mode);
      gl.uniform1f(rippleCountLocation, settings.rippleCount);
      gl.uniform1f(activeLocation, settings.active ? 1 : 0);
      gl.uniform1f(transitionTimeLocation, settings.drainStart);
      gl.uniform1f(timeLocation, runtime.elapsed);
      gl.uniform2f(originLocation, settings.originX, settings.originY);
      gl.uniform1i(textureLocation, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);

    const seed = new window.Image();
    seed.decoding = "async";
    seed.onload = () => {
      if (disposed) return;
      uploadImageRef.current(seed);
    };
    seed.src = defaultImageSrc;

    return () => {
      disposed = true;
      seed.onload = null;
      uploadImageRef.current = () => {};
      window.cancelAnimationFrame(animationFrame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  const playFromCenter = () => {
    settingsRef.current.active = true;
    settingsRef.current.mode = loopEnabled ? 1 : 0;
    settingsRef.current.drainStart = 0;
    runtimeRef.current.elapsed = 0;
    runtimeRef.current.lastFrame = 0;
    runtimeRef.current.playing = true;
    setPlaying(true);
  };

  const togglePlayPause = () => {
    const runtime = runtimeRef.current;
    if (runtime.playing) {
      runtime.playing = false;
      setPlaying(false);
      return;
    }

    if (!settingsRef.current.active) {
      playFromCenter();
      return;
    }

    runtime.lastFrame = 0;
    runtime.playing = true;
    setPlaying(true);
  };

  const toggleLoop = () => {
    if (!loopEnabled) {
      settingsRef.current.mode = 1;
      setLoopEnabled(true);
      return;
    }

    setLoopEnabled(false);
    const runtime = runtimeRef.current;
    if (!runtime.playing) {
      settingsRef.current.mode = 0;
      runtime.elapsed = 0;
      return;
    }
    settingsRef.current.mode = 2;
    settingsRef.current.drainStart = runtime.elapsed;
  };

  const setOriginFromPointer = (event: {
    clientX: number;
    clientY: number;
    currentTarget: EventTarget & HTMLElement;
  }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    settingsRef.current.originX = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    settingsRef.current.originY = Math.min(
      1,
      Math.max(0, 1 - (event.clientY - rect.top) / rect.height),
    );
  };

  const toggleCursorFollow = () => {
    setCursorFollow((enabled) => {
      if (enabled) {
        settingsRef.current.originX = 0.5;
        settingsRef.current.originY = 0.5;
        return false;
      }
      return true;
    });
  };

  const closeControls = () => {
    setMenuOpen(false);
    setDetailControl(null);
    window.requestAnimationFrame(() => moreButtonRef.current?.focus());
  };

  const detailConfig = {
    ripples: {
      label: "Ripples",
      value: String(rippleCount),
      ...CONTROL_RANGES.ripples,
      numericValue: rippleCount,
      setValue: (next: number) =>
        setRippleCount(
          Math.round(
            clamp(next, CONTROL_RANGES.ripples.min, CONTROL_RANGES.ripples.max),
          ),
        ),
    },
    speed: {
      label: "Speed",
      value: `${speed.toFixed(2).replace(/\.?0+$/, "")}×`,
      ...CONTROL_RANGES.speed,
      numericValue: speed,
      setValue: (next: number) =>
        setSpeed(
          Number(
            clamp(next, CONTROL_RANGES.speed.min, CONTROL_RANGES.speed.max).toFixed(
              2,
            ),
          ),
        ),
    },
    width: {
      label: "Width",
      value: `${Math.round(rippleWidth * 100)}%`,
      ...CONTROL_RANGES.width,
      numericValue: rippleWidth,
      setValue: (next: number) =>
        setRippleWidth(
          Number(
            clamp(next, CONTROL_RANGES.width.min, CONTROL_RANGES.width.max).toFixed(
              2,
            ),
          ),
        ),
    },
  };
  const toggleParameter = (control: DetailControl) => {
    if (detailControl === control) {
      setDetailControl(null);
      window.requestAnimationFrame(() =>
        parameterRefs.current[control]?.focus(),
      );
      return;
    }
    setDetailControl(control);
  };

  const applyImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const source = new window.Image();
    source.decoding = "async";
    source.onload = () => {
      uploadImageRef.current(source);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = url;
      setImageSrc(url);
      playFromCenter();
    };
    source.onerror = () => {
      URL.revokeObjectURL(url);
    };
    source.src = url;
  };

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDropActive(true);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDropActive(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setDropActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) applyImageFile(file);
  };

  return (
    <div
      className={[styles.ripple, className ?? ""].filter(Boolean).join(" ")}
    >
      <div
        className={styles.visual}
        role="img"
        aria-label={
          cursorFollow
            ? "Blue-and-white azulejo tiles seen through a cursor-following three-dimensional water ripple"
            : "Blue-and-white azulejo tiles seen through a center-radiating three-dimensional water ripple"
        }
        data-cursor-follow={cursorFollow}
        data-drop-active={dropActive}
        onPointerMove={(event) => {
          if (!cursorFollow) return;
          setOriginFromPointer(event);
        }}
        onPointerDown={(event) => {
          if (cursorFollow) {
            setOriginFromPointer(event);
          }
        }}
        onClick={(event) => {
          if (dropActive) return;
          event.stopPropagation();
          if (cursorFollow) {
            setOriginFromPointer(event);
          }
          playFromCenter();
        }}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <img
          alt=""
          className={styles.base}
          decoding="async"
          height={defaultImageHeight}
          loading="eager"
          src={defaultImageSrc}
          width={defaultImageWidth}
        />
        {imageSrc !== defaultImageSrc ? (
          <img
            alt=""
            className={styles.base}
            decoding="async"
            height={defaultImageHeight}
            loading="lazy"
            src={imageSrc}
            width={defaultImageWidth}
          />
        ) : null}
        <canvas className={styles.surface} ref={canvasRef} aria-hidden="true" />
        <div className={styles.dropOverlay} aria-hidden={!dropActive}>
          Drop to try your image
        </div>
      </div>

      <input
        accept="image/*"
        className={styles.fileInput}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) applyImageFile(file);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />

      <div
        className={styles.controlDock}
        data-detail={detailControl ?? "none"}
        data-open={menuOpen}
        ref={controlDockRef}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          if (detailControl) {
            event.preventDefault();
            event.stopPropagation();
            const previous = detailControl;
            setDetailControl(null);
            window.requestAnimationFrame(() =>
              parameterRefs.current[previous]?.focus(),
            );
            return;
          }
          if (menuOpen) {
            event.preventDefault();
            event.stopPropagation();
            closeControls();
          }
        }}
      >
        <div
          className={styles.controlPanel}
          id={controlsId}
          role="group"
          aria-label="Ripple controls"
        >
          <div className={styles.mainControls}>
            <button
              ref={firstControlRef}
              className={styles.controlAction}
              data-active={playing}
              onClick={togglePlayPause}
              tabIndex={menuOpen ? 0 : -1}
              type="button"
              aria-label={playing ? "Pause ripple" : "Play ripple"}
              aria-pressed={playing}
            >
              <span className={styles.playbackIcon} data-playing={playing} aria-hidden="true">
                <span className={styles.pauseIcon}>
                  <i />
                  <i />
                </span>
                <span className={styles.playIcon} />
              </span>
            </button>
            <button
              className={styles.controlAction}
              data-active={loopEnabled}
              onClick={toggleLoop}
              tabIndex={menuOpen ? 0 : -1}
              type="button"
              aria-label={loopEnabled ? "Turn looping off" : "Turn looping on"}
              aria-pressed={loopEnabled}
            >
              <span className={styles.loopIcon} data-on={loopEnabled} aria-hidden="true">
                <svg
                  className={styles.stateOn}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.828 9.172a4 4 0 1 0 0 5.656a10 10 0 0 0 2.172-2.828a10 10 0 0 1 2.172-2.828a4 4 0 1 1 0 5.656a10 10 0 0 1-2.172-2.828a10 10 0 0 0-2.172-2.828" />
                </svg>
                <svg
                  className={styles.stateOff}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8.165 8.174a4 4 0 0 0-5.166 3.826a4 4 0 0 0 6.829 2.828a10 10 0 0 0 2.172-2.828m1.677-2.347a10 10 0 0 1 .495-.481a4 4 0 1 1 5.129 6.1m-3.521.537a4 4 0 0 1-1.608-.981a10 10 0 0 1-2.172-2.828" />
                  <path d="M3 3l18 18" />
                </svg>
              </span>
            </button>
            <button
              className={styles.controlAction}
              data-active={cursorFollow}
              onClick={toggleCursorFollow}
              tabIndex={menuOpen ? 0 : -1}
              type="button"
              aria-label={
                cursorFollow
                  ? "Radiate ripples from center"
                  : "Radiate ripples from cursor"
              }
              aria-pressed={cursorFollow}
            >
              <span
                className={styles.cursorIcon}
                data-on={cursorFollow}
                aria-hidden="true"
              >
                <svg
                  className={styles.stateOn}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7.904 17.563a1.2 1.2 0 0 0 2.228.308l2.09-3.093l4.907 4.907a1.067 1.067 0 0 0 1.509 0l1.047-1.047a1.067 1.067 0 0 0 0-1.509l-4.907-4.907l3.113-2.09a1.2 1.2 0 0 0-.309-2.228l-13.582-3.904l3.904 13.563" />
                </svg>
                <svg
                  className={styles.stateOff}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15.662 11.628l2.229-1.496a1.2 1.2 0 0 0-.309-2.228l-8.013-2.303m-5.569-1.601l3.904 13.563a1.2 1.2 0 0 0 2.228.308l2.09-3.093l4.907 4.907a1.067 1.067 0 0 0 1.509 0l.524-.524" />
                  <path d="M3 3l18 18" />
                </svg>
              </span>
            </button>
            {(["speed", "ripples", "width"] as const).map((control) => {
              const config = detailConfig[control];
              const expanded = detailControl === control;
              return (
                <div
                  className={styles.parameter}
                  data-expanded={expanded}
                  key={control}
                >
                  <button
                    className={styles.parameterToggle}
                    onClick={() => toggleParameter(control)}
                    ref={(node) => {
                      parameterRefs.current[control] = node ?? undefined;
                    }}
                    tabIndex={menuOpen ? 0 : -1}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`ripple-${control}-scrubber`}
                  >
                    <span>{config.label}</span>
                    <strong>{config.value}</strong>
                  </button>
                  <div className={styles.parameterScrubber}>
                    <input
                      className={styles.scrubber}
                      id={`ripple-${control}-scrubber`}
                      ref={expanded ? scrubberRef : undefined}
                      type="range"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={config.numericValue}
                      onChange={(event) =>
                        config.setValue(Number(event.target.value))
                      }
                      style={
                        {
                          "--scrubber-progress": `${
                            ((config.numericValue - config.min) /
                              (config.max - config.min)) *
                            100
                          }%`,
                        } as CSSProperties
                      }
                      tabIndex={menuOpen && expanded ? 0 : -1}
                      aria-hidden={!expanded}
                      aria-label={config.label}
                      aria-valuetext={config.value}
                      disabled={!expanded}
                    />
                  </div>
                </div>
              );
            })}
            <div className={styles.imageActions}>
              <button
                className={styles.dropHint}
                onClick={() => fileInputRef.current?.click()}
                tabIndex={menuOpen ? 0 : -1}
                type="button"
              >
                Drop or select image
              </button>
            </div>
          </div>
        </div>

        <button
          className={styles.moreButton}
          ref={moreButtonRef}
          onClick={() => {
            if (menuOpen) closeControls();
            else setMenuOpen(true);
          }}
          type="button"
          aria-controls={controlsId}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close ripple controls" : "Open ripple controls"}
        >
          <span className={styles.moreIcon} data-open={menuOpen} aria-hidden="true">
            <svg className={styles.moreDots} viewBox="0 0 18 18" fill="currentColor">
              <circle cx="4" cy="9" r="1.5" />
              <circle cx="9" cy="9" r="1.5" />
              <circle cx="14" cy="9" r="1.5" />
            </svg>
            <svg
              className={styles.moreClose}
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M5 5l8 8" />
              <path d="M13 5l-8 8" />
            </svg>
          </span>
        </button>
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {loopEnabled ? "Ripple loop on" : "Ripple loop off"}.{" "}
        {cursorFollow
          ? "Ripples follow the cursor"
          : "Ripples radiate from the center"}
      </span>
    </div>
  );
}
