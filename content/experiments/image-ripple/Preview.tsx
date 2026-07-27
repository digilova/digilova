"use client";

/* eslint-disable @next/next/no-img-element -- the native image is the fallback and WebGL texture source. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import backgroundImage from "./assets/boats.webp";
import styles from "./Preview.module.css";

type DetailControl = "ripples" | "speed" | "width";

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
  varying vec2 v_uv;

  float gaussian(float value, float center, float width) {
    float position = (value - center) / width;
    return exp(-(position * position));
  }

  void main() {
    vec2 point = v_uv - 0.5;
    point.x *= u_aspect;

    float radius = length(point);
    vec2 direction = radius > 0.0001 ? point / radius : vec2(0.0);
    vec2 uvDirection = vec2(direction.x / u_aspect, direction.y);

    float edgeRadius = length(vec2(0.5 * u_aspect, 0.5));
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
        clamp(waveRadius / edgeRadius, 0.0, 1.0)
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
        clamp(waveRadius / edgeRadius, 0.0, 1.0)
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

const imageProps = {
  src: backgroundImage.src,
  width: 1730,
  height: 1154,
  loading: "lazy" as const,
  decoding: "async" as const,
};

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

export default function Preview({ className }: { className?: string }) {
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
    rippleCount: 3,
    rippleWidth: 1.35,
    speed: 1,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [rippleCount, setRippleCount] = useState(3);
  const [rippleWidth, setRippleWidth] = useState(1.35);
  const [speed, setSpeed] = useState(1);
  const [detailControl, setDetailControl] =
    useState<DetailControl | null>(null);

  useEffect(() => {
    settingsRef.current = {
      ...settingsRef.current,
      rippleCount,
      rippleWidth,
      speed,
    };
  }, [rippleCount, rippleWidth, speed]);

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

    let animationFrame = 0;
    let disposed = false;

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
      gl.uniform1i(textureLocation, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrame = window.requestAnimationFrame(render);
    };

    const source = new window.Image();
    source.decoding = "async";
    source.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
      animationFrame = window.requestAnimationFrame(render);
    };
    source.src = backgroundImage.src;

    return () => {
      disposed = true;
      source.onload = null;
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

  const closeControls = () => {
    setMenuOpen(false);
    setDetailControl(null);
    window.requestAnimationFrame(() => moreButtonRef.current?.focus());
  };

  const detailConfig = {
    ripples: {
      label: "Ripples",
      value: String(rippleCount),
      min: 1,
      max: 5,
      step: 1,
      numericValue: rippleCount,
      setValue: (next: number) => setRippleCount(Math.round(next)),
    },
    speed: {
      label: "Speed",
      value: `${speed.toFixed(2).replace(/\.?0+$/, "")}×`,
      min: 0.5,
      max: 2,
      step: 0.05,
      numericValue: speed,
      setValue: (next: number) =>
        setSpeed(Number(Math.min(2, Math.max(0.5, next)).toFixed(2))),
    },
    width: {
      label: "Width",
      value: `${Math.round(rippleWidth * 100)}%`,
      min: 0.75,
      max: 2.25,
      step: 0.01,
      numericValue: rippleWidth,
      setValue: (next: number) =>
        setRippleWidth(
          Number(Math.min(2.25, Math.max(0.75, next)).toFixed(2)),
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

  return (
    <div
      className={[styles.ripple, className ?? ""].filter(Boolean).join(" ")}
    >
      <div
        className={styles.visual}
        role="img"
        aria-label="Miniature sailboats seen through a center-radiating three-dimensional water ripple"
      >
        <img {...imageProps} className={styles.base} alt="" />
        <canvas className={styles.surface} ref={canvasRef} aria-hidden="true" />
      </div>

      <div
        className={styles.controlDock}
        data-detail={detailControl ?? "none"}
        data-open={menuOpen}
        ref={controlDockRef}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          if (detailControl) {
            const previous = detailControl;
            setDetailControl(null);
            window.requestAnimationFrame(() =>
              parameterRefs.current[previous]?.focus(),
            );
            return;
          }
          closeControls();
        }}
      >
        <div
          className={styles.controlPanel}
          id="ripple-controls"
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
                  className={styles.loopOn}
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
                  className={styles.loopOff}
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
          aria-controls="ripple-controls"
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
        {loopEnabled ? "Ripple loop on" : "Ripple loop off"}
      </span>
    </div>
  );
}
