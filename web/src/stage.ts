import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { PostFX } from "./postfx";
import { Dust } from "./dust";

// Blender es Z-arriba; glTF/Three es Y-arriba: (x, y, z) -> (x, z, -y)
export const fromBlender = (p: ArrayLike<number>): THREE.Vector3 => new THREE.Vector3(p[0], p[2], -p[1]);

/** alta: luz de estudio + oclusión, brillo y acabado de maqueta · básica: solo la escena (equipos lentos). */
export type Quality = "high" | "low";

/** Fondo: un resplandor cálido detrás de las estaciones en lugar de un color plano. */
function backdrop(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(256, 200, 20, 256, 256, 400);
  g.addColorStop(0, "#5c2a32");
  g.addColorStop(0.45, "#3a1a20");
  g.addColorStop(1, "#160a0c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  private readonly rim: THREE.DirectionalLight;
  private readonly fx: PostFX;
  private readonly dust = new Dust();
  private readonly clock = new THREE.Clock();
  private aim = new THREE.Vector3();
  quality: Quality = "high";
  private readonly sensorWidth = 36; // mm, igual que la cámara de Blender
  private readonly focal = 35; // mm

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    // Neutral respeta los colores de marca y de las capturas; solo comprime los brillos
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.scene.background = backdrop();
    this.scene.fog = new THREE.Fog("#2b1418", 34, 120); // suaviza el horizonte detrás de las estaciones
    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 400);

    // reflejos suaves de estudio: dan volumen a los materiales sin cambiar sus colores
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.16;
    pmrem.dispose();

    this.scene.add(new THREE.HemisphereLight("#ffe9d6", "#3b1d22", 0.42));
    // luz principal cálida (con sombras suaves) y una de contorno fría que separa las figuras del fondo
    this.sun = new THREE.DirectionalLight("#ffdcb8", 1.75);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.radius = 4;
    const s = this.sun.shadow.camera;
    s.left = -14; s.right = 14; s.top = 14; s.bottom = -14; s.near = 1; s.far = 80;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.rim = new THREE.DirectionalLight("#bcd2ff", 0.75);
    this.scene.add(this.sun, this.sun.target, this.rim, this.rim.target, this.dust.points);

    this.fx = new PostFX(this.renderer, this.scene, this.camera);
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  private pixelRatio(): number {
    return Math.min(window.devicePixelRatio, 2);
  }

  setQuality(q: Quality): void {
    this.quality = q;
    this.sun.shadow.radius = q === "high" ? 4 : 1;
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
    this.fx.setSize(w, h, this.pixelRatio());
    this.camera.aspect = w / h;
    this.camera.fov = this.verticalFov(this.camera.aspect);
    this.camera.updateProjectionMatrix();
  }

  /** Mantiene el recuadro de sombras alrededor de lo que mira la cámara; el contorno siempre llega desde atrás. */
  followLight(aim: THREE.Vector3): void {
    this.aim.copy(aim);
    this.sun.target.position.copy(aim);
    this.sun.position.copy(aim).add(new THREE.Vector3(10, 12, 9)); // algo bajo: sombras largas, más volumen
    this.sun.target.updateMatrixWorld();
    const back = aim.clone().sub(this.camera.position).setY(0).normalize().multiplyScalar(10);
    this.rim.target.position.copy(aim);
    this.rim.position.copy(aim).add(back).add(new THREE.Vector3(0, 7, 0));
    this.rim.target.updateMatrixWorld();
  }

  async loadModel(url: string): Promise<THREE.Group> {
    const gltf = await new GLTFLoader().loadAsync(url);
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.name.startsWith("m_scr_")) {
          // pantallas: brillan con su propia luz y no con la de la escena, para que la captura se lea tal cual
          mat.color.setRGB(0, 0, 0);
          mat.emissive.setRGB(1, 1, 1);
          mat.emissiveIntensity = 0.8; // bajo el umbral del brillo: el blanco no se empaña
          mat.roughness = 0.6;
          mat.envMapIntensity = 0.1;
        } else if (mat.name.startsWith("m_logo_")) mat.envMapIntensity = 0.15;
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

  /** Pose de cámara que encuadra de frente una pantalla (objeto scr_*) del modelo. */
  focusPose(root: THREE.Object3D, name: string): { pos: THREE.Vector3; aim: THREE.Vector3 } | null {
    const obj = root.getObjectByName(name) as THREE.Mesh | undefined;
    if (!obj?.isMesh) return null;
    obj.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const normalAttr = obj.geometry.attributes.normal;
    const normal = normalAttr
      ? new THREE.Vector3().fromBufferAttribute(normalAttr, 0).transformDirection(obj.matrixWorld)
      : new THREE.Vector3(0, 0, 1);
    const w = Math.max(size.x, size.z);
    const h = Math.hypot(size.y, Math.min(size.x, size.z));
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const d = Math.max(h / 2 / tanV, w / 2 / (tanV * this.camera.aspect)) * 1.18;
    return { pos: center.clone().add(normal.multiplyScalar(d)), aim: center };
  }

  /** Dibuja desde una pose sin que se vea, para que el navegador compile shaders y suba texturas antes de empezar. */
  warm(pos: THREE.Vector3, aim: THREE.Vector3): void {
    this.camera.position.copy(pos);
    this.camera.lookAt(aim);
    this.followLight(aim);
    this.render();
  }

  /** focus: 0 en el recorrido, 1 con la cámara encima de una pantalla. */
  render(focus = 0): void {
    const t = this.clock.getElapsedTime();
    this.dust.update(t, this.aim, (window.innerHeight * this.pixelRatio()) / 1080);
    this.dust.points.visible = focus < 0.98;
    if (this.quality === "high") this.fx.render(focus, t);
    else this.renderer.render(this.scene, this.camera);
  }
}
