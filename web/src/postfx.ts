import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

/** Oclusión ambiental a media resolución; las burbujas (sprites) no cuentan, igual que los puntos. */
class SceneAO extends GTAOPass {
  override setSize(width: number, height: number): void {
    super.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)));
  }

  override render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean,
  ): void {
    const hidden: THREE.Object3D[] = [];
    this.scene.traverseVisible((o) => {
      if ((o as THREE.Sprite).isSprite) hidden.push(o);
    });
    for (const o of hidden) o.visible = false;
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    for (const o of hidden) o.visible = true;
  }
}

/**
 * Acabado de maqueta: desenfoque arriba y abajo (tilt-shift), un leve viraje cálido y grano de película.
 * Va después de OutputPass, así que trabaja sobre colores ya en sRGB.
 */
const FinishShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    resolution: { value: new THREE.Vector2(1, 1) },
    time: { value: 0 },
    tilt: { value: 1 },
    grain: { value: 0.03 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float time;
    uniform float tilt;
    uniform float grain;
    varying vec2 vUv;

    const vec2 DISK[12] = vec2[](
      vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621),
      vec2(0.962, -0.195), vec2(0.473, -0.480), vec2(0.519, 0.767), vec2(0.185, -0.893),
      vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598));

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      // banda nítida en el centro; se desenfoca el primer plano (abajo) y apenas el fondo (arriba, donde van las burbujas)
      float band = max(smoothstep(0.24, 0.5, 0.52 - vUv.y), 0.25 * smoothstep(0.3, 0.5, vUv.y - 0.52)) * tilt;
      vec3 col = base.rgb;
      if (band > 0.002) {
        vec2 r = band * 5.0 * (resolution.y / 1080.0) / resolution;
        vec3 acc = col;
        for (int i = 0; i < 12; i++) acc += texture2D(tDiffuse, vUv + DISK[i] * r).rgb;
        col = acc / 13.0;
      }
      // viraje: sombras hacia el burdeos, luces hacia el crema
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(col, col * vec3(1.05, 0.97, 0.95), (1.0 - l) * 0.35);
      col = mix(col, col * vec3(1.02, 1.0, 0.97), l * 0.3);
      col += (col - 0.5) * 0.05; // un poco más de contraste
      col += (hash(vUv * resolution + fract(time) * 97.0) - 0.5) * grain;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), base.a);
    }`,
};

export class PostFX {
  private readonly composer: EffectComposer;
  private readonly ao: SceneAO;
  private readonly bloom: UnrealBloomPass;
  private readonly finish: ShaderPass;
  private readonly bloomStrength = 0.22;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    const size = renderer.getSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, target);
    this.composer.addPass(new RenderPass(scene, camera));

    this.ao = new SceneAO(scene, camera, size.x, size.y);
    this.ao.blendIntensity = 1;
    this.ao.updateGtaoMaterial({ radius: 0.75, distanceExponent: 1.4, thickness: 1.4, scale: 1.1, samples: 12 });
    this.ao.updatePdMaterial({ samples: 12, radius: 6 });
    this.composer.addPass(this.ao);

    // umbral alto: solo brillan pantallas, anillos y luces, no las paredes claras
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), this.bloomStrength, 0.4, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.finish = new ShaderPass(FinishShader);
    this.composer.addPass(this.finish);
  }

  setSize(width: number, height: number, pixelRatio: number): void {
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
    (this.finish.uniforms.resolution.value as THREE.Vector2).set(width * pixelRatio, height * pixelRatio);
  }

  /** focus: 0 recorrido · 1 cámara pegada a una pantalla (sin desenfoque ni brillo, para que se lea). */
  render(focus: number, time: number): void {
    const open = 1 - focus;
    this.bloom.strength = this.bloomStrength * open;
    this.finish.uniforms.tilt.value = open;
    this.finish.uniforms.grain.value = 0.01 + 0.014 * open;
    this.finish.uniforms.time.value = time;
    this.composer.render();
  }
}
