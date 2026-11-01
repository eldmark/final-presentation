import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Blender es Z-arriba; glTF/Three es Y-arriba: (x, y, z) -> (x, z, -y)
export const fromBlender = (p: ArrayLike<number>): THREE.Vector3 => new THREE.Vector3(p[0], p[2], -p[1]);

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  private readonly sensorWidth = 36; // mm, igual que la cámara de Blender
  private readonly focal = 35; // mm

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; // mismo criterio que Blender ("Standard")

    this.scene.background = new THREE.Color("#2A1A1D");
    this.scene.fog = new THREE.Fog("#2A1A1D", 38, 130); // suaviza el horizonte detrás de las estaciones
    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 400);

    this.scene.add(new THREE.HemisphereLight("#fff3e8", "#3b2327", 0.95));
    this.sun = new THREE.DirectionalLight("#ffffff", 1.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.left = -14; s.right = 14; s.top = 14; s.bottom = -14; s.near = 1; s.far = 80;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  /** Campo de visión vertical equivalente a una lente de 35 mm en sensor de 36 mm (ajuste horizontal). */
  private verticalFov(aspect: number): number {
    const h = 2 * Math.atan(this.sensorWidth / 2 / this.focal);
    return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(h / 2) / aspect));
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = this.verticalFov(this.camera.aspect);
    this.camera.updateProjectionMatrix();
  }

  /** Mantiene el recuadro de sombras alrededor de lo que mira la cámara. */
  followLight(aim: THREE.Vector3): void {
    this.sun.target.position.copy(aim);
    this.sun.position.copy(aim).add(new THREE.Vector3(9, 16, 10));
    this.sun.target.updateMatrixWorld();
  }

  async loadModel(url: string): Promise<THREE.Group> {
    const gltf = await new GLTFLoader().loadAsync(url);
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    this.scene.add(gltf.scene);
    return gltf.scene;
  }

  /**
   * Cambia la imagen de una pantalla (objetos "scr_*") sin volver a exportar de Blender.
   * Se configura en public/screens/manifest.json: { "overrides": { "scr_monitor_10": "ventas.jpg" } }
   */
  async applyScreenOverrides(root: THREE.Object3D, base = "screens/"): Promise<string[]> {
    let overrides: Record<string, string> = {};
    try {
      const res = await fetch(`${base}manifest.json`, { cache: "no-cache" });
      if (res.ok && (res.headers.get("content-type") ?? "").includes("json")) {
        overrides = ((await res.json()) as { overrides?: Record<string, string> }).overrides ?? {};
      }
    } catch {
      return [];
    }
    const loader = new THREE.TextureLoader();
    const applied: string[] = [];
    for (const [objName, file] of Object.entries(overrides)) {
      const obj = root.getObjectByName(objName) as THREE.Mesh | undefined;
      if (!obj?.isMesh) continue;
      const tex = await loader.loadAsync(`${base}${file}`);
      tex.flipY = false; // convención de glTF
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const mat = obj.material as THREE.MeshStandardMaterial;
      mat.map = tex;
      if (mat.emissiveMap) mat.emissiveMap = tex;
      mat.needsUpdate = true;
      applied.push(objName);
    }
    return applied;
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
