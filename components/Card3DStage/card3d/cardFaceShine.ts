import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";

const SHINE_DELAY = 2.2;
const SHINE_DURATION = 3.2;

export function attachStudioShineShader(material: THREE.MeshPhysicalMaterial) {
  if (material.userData.studioShineAttached) return;
  material.userData.studioShineAttached = true;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uShinePos = { value: -2.0 };
    shader.uniforms.uShineIntensity = { value: 0.0 };

    shader.fragmentShader = `
      uniform float uShinePos;
      uniform float uShineIntensity;
    ${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <output_fragment>",
      `
      #if defined( USE_UV ) || defined( USE_MAP_UV )
        if (uShineIntensity > 0.001) {
          #ifdef USE_MAP_UV
            vec2 shineUv = vMapUv;
          #else
            vec2 shineUv = vUv;
          #endif
          float diag = shineUv.x + shineUv.y;
          const float band = 0.11;
          float shine = smoothstep(uShinePos - band, uShinePos - band * 0.2, diag)
                      * (1.0 - smoothstep(uShinePos + band * 0.05, uShinePos + band * 0.85, diag));
          vec3 viewDir = normalize(vViewPosition);
          float ndv = abs(dot(normalize(vNormal), viewDir));
          float spec = pow(clamp(1.0 - ndv, 0.0, 1.0), 2.4);
          outgoingLight += shine * uShineIntensity * mix(0.12, 1.0, spec) * vec3(1.0);
        }
      #endif
      #include <output_fragment>
      `,
    );

    material.userData.shineShader = shader;
  };

  material.needsUpdate = true;
}

type CardStudioShineDriverProps = {
  enabled?: boolean;
  materialRef: RefObject<THREE.MeshPhysicalMaterial | null>;
};

export function CardStudioShineDriver({ enabled = true, materialRef }: CardStudioShineDriverProps) {
  const played = useRef(false);

  useFrame(({ clock }) => {
    if (!enabled || played.current) return;

    const shader = materialRef.current?.userData?.shineShader as
      | { uniforms: { uShinePos: { value: number }; uShineIntensity: { value: number } } }
      | undefined;
    if (!shader?.uniforms?.uShinePos) return;

    const t = clock.elapsedTime;

    if (t < SHINE_DELAY) {
      shader.uniforms.uShineIntensity.value = 0;
      return;
    }

    const progress = (t - SHINE_DELAY) / SHINE_DURATION;
    if (progress >= 1) {
      played.current = true;
      shader.uniforms.uShineIntensity.value = 0;
      shader.uniforms.uShinePos.value = -2;
      return;
    }

    const eased =
      progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    shader.uniforms.uShinePos.value = THREE.MathUtils.lerp(2.18, -0.08, eased);
    shader.uniforms.uShineIntensity.value = Math.sin(progress * Math.PI) * 0.48;
  });

  return null;
}
