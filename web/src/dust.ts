import * as THREE from "three";

/**
 * Polvo flotando en la luz alrededor de lo que mira la cámara.
 * Las motas viven en una caja que se repite en el mundo: al viajar entre estaciones no se arrastran con la cámara.
 */
export class Dust {
  readonly points: THREE.Points;
  private readonly material: THREE.ShaderMaterial;

  constructor(count = 520, box = new THREE.Vector3(16, 5, 16)) {
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = Math.random() * box.x;
      pos[i * 3 + 1] = Math.random() * box.y;
      pos[i * 3 + 2] = Math.random() * box.z;
      phase[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("phase", new THREE.BufferAttribute(phase, 1));
    // la caja se mueve con el centro: sin esto, three la recortaría al salir de su volumen original
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uCenter: { value: new THREE.Vector3() },
        uBox: { value: box },
        uSpeed: { value: still ? 0 : 1 },
        uScale: { value: 1 },
        uColor: { value: new THREE.Color("#ffdcae") },
      },
      vertexShader: /* glsl */ `
        attribute float phase;
        uniform float uTime;
        uniform vec3 uCenter;
        uniform vec3 uBox;
        uniform float uSpeed;
        uniform float uScale;
        varying float vAlpha;
        void main() {
          float t = uTime * uSpeed;
          vec3 drift = vec3(0.06, 0.035, 0.045) * t
            + vec3(sin(t * 0.31 + phase * 6.28) * 0.18, sin(t * 0.23 + phase * 12.0) * 0.12, cos(t * 0.27 + phase * 9.0) * 0.18);
          vec3 origin = uCenter - vec3(uBox.x * 0.5, 0.15, uBox.z * 0.5);
          vec3 p = mod(position + drift - origin, uBox) + origin;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float d = max(-mv.z, 0.1);
          gl_PointSize = uScale * (0.9 + phase * 1.6) * 14.0 / d;
          vec3 q = (p - origin) / uBox * 2.0 - 1.0;
          float edge = 1.0 - smoothstep(0.65, 1.0, max(max(abs(q.x), abs(q.y)), abs(q.z)));
          float twinkle = 0.55 + 0.45 * sin(t * 0.9 + phase * 40.0);
          vAlpha = edge * twinkle * smoothstep(0.6, 2.0, d);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.0, r);
          gl_FragColor = vec4(uColor, a * a * vAlpha * 0.5);
        }`,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
  }

  /** scale: tamaño en píxeles por unidad de alto de la ventana (las motas se ven igual en cualquier pantalla). */
  update(time: number, center: THREE.Vector3, scale: number): void {
    this.material.uniforms.uTime.value = time;
    (this.material.uniforms.uCenter.value as THREE.Vector3).copy(center);
    this.material.uniforms.uScale.value = scale;
  }
}
