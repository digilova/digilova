"use client";

/* eslint-disable @next/next/no-img-element -- the native image is the fallback and WebGL texture source. */
import { useEffect, useRef } from "react";
import backgroundImage from "./assets/boats.webp";
import styles from "./Preview.module.css";

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

    for (int wave = 0; wave < 3; wave++) {
      float phaseOffset = float(wave) * travelRadius / 3.0;
      float waveRadius = mod(
        (u_time * travelRadius / cycle) + phaseOffset,
        travelRadius
      );

      float distanceToCrest = radius - waveRadius;
      float bandWidth = mix(
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
      float visibility = birthFade * exitFade;
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

export default function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const textureLocation = gl.getUniformLocation(program, "u_texture");
    if (
      positionLocation < 0 ||
      uvLocation < 0 ||
      !aspectLocation ||
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
    let resizeObserver: ResizeObserver | undefined;
    let startedAt = 0;
    let disposed = false;

    const render = (time: number) => {
      if (disposed) return;
      if (!startedAt) startedAt = time;

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
      gl.uniform1f(timeLocation, (time - startedAt) / 1000);
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
      resizeObserver = new ResizeObserver(() => {
        canvas.width = 0;
      });
      resizeObserver.observe(canvas);
      animationFrame = window.requestAnimationFrame(render);
    };
    source.src = backgroundImage.src;

    return () => {
      disposed = true;
      source.onload = null;
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(animationFrame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <div
      className={styles.ripple}
      role="img"
      aria-label="Miniature sailboats seen through a center-radiating three-dimensional water ripple"
    >
      <img {...imageProps} className={styles.base} alt="" />
      <canvas className={styles.surface} ref={canvasRef} aria-hidden="true" />

      <span className={styles.label} aria-hidden="true">
        Image ripple
      </span>
    </div>
  );
}
