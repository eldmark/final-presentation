import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * Ambientación hecha en código encima del diorama de Blender: estanterías llenas, vetas de madera,
 * yeso, botella de vidrio, lámparas con luz cálida, plantas, alfombras y cuadros.
 * Las posiciones siguen la disposición de blender/01_greybox.py (estaciones cada 9 m en X;
 * en Three la "y" de Blender es -z).
 */
const SPACING = 9;
const sx = (i: number) => i * SPACING;

// ---------- texturas procedurales (sin UV: se calculan con la posición en el mundo) ----------

const NOISE = /* glsl */ `
  varying vec3 vDecorPos;
  varying vec3 vDecorNormal;
  float dHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float dNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dHash(vec3(i, 0.0)), b = dHash(vec3(i + vec2(1.0, 0.0), 0.0));
    float c = dHash(vec3(i + vec2(0.0, 1.0), 0.0)), d = dHash(vec3(i + vec2(1.0, 1.0), 0.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float dFbm(vec2 p) { return 0.5 * dNoise(p) + 0.3 * dNoise(p * 2.1) + 0.2 * dNoise(p * 4.3); }`;

const SURFACES = {
  // vetas a lo largo de X (tablas, mostradores, escritorios)
  wood: /* glsl */ `{
    vec3 n = abs(vDecorNormal);
    float cross = n.y > 0.5 ? vDecorPos.z : vDecorPos.y;
    float along = n.x > 0.5 ? vDecorPos.z : vDecorPos.x;
    float w = cross * 11.0 + dFbm(vec2(along * 0.8, cross * 5.0)) * 2.6;
    float rings = 0.5 + 0.5 * sin(w * 6.2831);
    diffuseColor.rgb *= mix(0.84, 1.07, rings) * (0.9 + 0.18 * dFbm(vec2(along * 2.0, cross * 30.0)));
  }`,
  // yeso: manchas suaves y grano fino
  plaster: /* glsl */ `{
    vec2 q = vDecorPos.xy + vDecorPos.zx;
    diffuseColor.rgb *= 0.95 + 0.07 * dFbm(q * 1.4) + 0.025 * (dHash(floor(vDecorPos * 160.0)) - 0.5);
  }`,
  // piso: apenas una variación para que no sea un plano liso
  ground: /* glsl */ `{
    diffuseColor.rgb *= 0.9 + 0.14 * dFbm(vDecorPos.xz * 0.35) + 0.04 * dFbm(vDecorPos.xz * 6.0);
  }`,
};

function surface(mat: THREE.Material, kind: keyof typeof SURFACES): void {
  if (mat.userData.decor) return;
  mat.userData.decor = kind;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDecorPos;\nvarying vec3 vDecorNormal;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvDecorPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvDecorNormal = normalize(mat3(modelMatrix) * objectNormal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${NOISE}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${SURFACES[kind]}`);
  };
  mat.customProgramCacheKey = () => `decor-${kind}`;
  mat.needsUpdate = true;
}

// ---------- utilidades ----------

const std = (color: string, roughness = 0.7, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], parent: THREE.Object3D): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const rnd = (() => {
  let s = 7; // misma decoración en cada carga
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
})();
const pick = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];

// ---------- botellas de la estantería (instanciadas) ----------

type BottleKind = { body: THREE.BufferGeometry; h: number; r: number };

function lathe(points: [number, number][], segments = 14): THREE.BufferGeometry {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

const KINDS: BottleKind[] = [
  // vino
  { body: lathe([[0, 0], [0.038, 0], [0.04, 0.005], [0.04, 0.2], [0.034, 0.235], [0.014, 0.26], [0.013, 0.32], [0, 0.32]]), h: 0.32, r: 0.04 },
  // whisky (facetado)
  { body: lathe([[0, 0], [0.046, 0], [0.048, 0.01], [0.048, 0.18], [0.03, 0.21], [0.016, 0.225], [0.016, 0.27], [0, 0.27]], 6), h: 0.27, r: 0.048 },
  // licor alto
  { body: lathe([[0, 0], [0.032, 0], [0.034, 0.01], [0.034, 0.24], [0.02, 0.27], [0.011, 0.29], [0.011, 0.34], [0, 0.34]]), h: 0.34, r: 0.034 },
  // lata
  { body: lathe([[0, 0], [0.028, 0], [0.031, 0.01], [0.031, 0.11], [0.026, 0.125], [0, 0.125]], 12), h: 0.125, r: 0.031 },
];
const GLASS = ["#5a2a0c", "#7a3a10", "#1f4d2b", "#163824", "#2a1416", "#c9d6d4", "#8e2a1e", "#23395b"];
const CANS = ["#841c26", "#d4a53c", "#2c6bd6", "#f5f0eb", "#1a1a1a", "#3e8e5a"];
const LABELS = ["#f5f0eb", "#e9dcc4", "#d4a53c", "#1a1214", "#841c26", "#ffffff"];

class BottleRack {
  private readonly items: { kind: number; m: THREE.Matrix4; glass: THREE.Color; label: THREE.Color }[] = [];

  add(kind: number, x: number, y: number, z: number, yaw = rnd() * Math.PI * 2): void {
    const can = kind === 3;
    this.items.push({
      kind,
      m: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(1, 1, 1)),
      glass: new THREE.Color(can ? pick(CANS) : pick(GLASS)),
      label: new THREE.Color(can ? "#c9c9c9" : pick(LABELS)),
    });
  }

  /** Una fila de botellas a lo ancho de una tabla. */
  row(x0: number, x1: number, y: number, z: number, kinds: number[]): void {
    let x = x0;
    while (x < x1) {
      const kind = pick(kinds);
      const r = KINDS[kind].r;
      if (x + r * 2 > x1) break;
      this.add(kind, x + r, y, z + (rnd() - 0.5) * 0.03);
      x += r * 2 + 0.012 + rnd() * 0.02;
    }
  }

  build(parent: THREE.Object3D): void {
    const glassMat = std("#ffffff", 0.12, { envMapIntensity: 1.4 });
    const labelMat = std("#ffffff", 0.8);
    const capMat = std("#d4a53c", 0.35, { metalness: 0.6 });
    KINDS.forEach((k, kind) => {
      const list = this.items.filter((it) => it.kind === kind);
      if (!list.length) return;
      const body = new THREE.InstancedMesh(k.body, glassMat, list.length);
      // etiqueta: una banda un poco más ancha que el cuerpo; tapa: un disco arriba
      const labelGeo = new THREE.CylinderGeometry(k.r * 1.04, k.r * 1.04, k.h * (kind === 3 ? 0.55 : 0.32), kind === 1 ? 6 : 14, 1, true);
      labelGeo.translate(0, k.h * (kind === 3 ? 0.5 : 0.36), 0);
      const label = new THREE.InstancedMesh(labelGeo, labelMat, list.length);
      const capGeo = new THREE.CylinderGeometry(kind === 3 ? k.r * 0.85 : 0.015, kind === 3 ? k.r * 0.85 : 0.015, 0.02, 10);
      capGeo.translate(0, k.h, 0);
      const cap = new THREE.InstancedMesh(capGeo, capMat, list.length);
      list.forEach((it, i) => {
        body.setMatrixAt(i, it.m);
        body.setColorAt(i, it.glass);
        label.setMatrixAt(i, it.m);
        label.setColorAt(i, it.label);
        cap.setMatrixAt(i, it.m);
      });
      for (const im of [body, label, cap]) {
        im.castShadow = true;
        im.receiveShadow = true;
        parent.add(im);
      }
    });
  }
}

// ---------- muebles y adornos ----------

const WOOD_DARK = std("#5b3a26", 0.65);
const WOOD = std("#8a5a3b", 0.7);
surface(WOOD_DARK, "wood");
surface(WOOD, "wood");

/** Estantería abierta (fondo, lados y techo) en lugar del bloque macizo; las tablas son las del modelo. */
function openShelf(parent: THREE.Object3D, x: number, z: number, rack: BottleRack): void {
  const back = z - 0.2; // cara trasera del bloque original
  mesh(new THREE.BoxGeometry(2.8, 2.5, 0.04), WOOD_DARK, [x, 1.25, back], parent);
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.06, 2.5, 0.48), WOOD_DARK, [x + s * 1.4, 1.25, z + 0.04], parent);
  mesh(new THREE.BoxGeometry(2.92, 0.06, 0.5), WOOD_DARK, [x, 2.5, z + 0.04], parent);
  // tablas del modelo: y = 0.4 + k·0.55, 4 cm de grueso
  for (let k = 0; k < 4; k++) {
    const top = 0.42 + k * 0.55;
    const kinds = k === 3 ? [0, 1, 2, 3] : k === 0 ? [3, 1] : [0, 1, 2];
    rack.row(x - 1.33, x + 1.33, top, z - 0.04, kinds);
    if (k < 3) rack.row(x - 1.33, x + 1.33, top, z + 0.12, kinds);
  }
}

function crate(parent: THREE.Object3D, x: number, y: number, z: number, yaw: number, rack: BottleRack): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = yaw;
  parent.add(g);
  for (const [w, h, d, px, py, pz] of [
    [0.6, 0.04, 0.42, 0, 0.02, 0],
    [0.6, 0.3, 0.03, 0, 0.15, 0.195],
    [0.6, 0.3, 0.03, 0, 0.15, -0.195],
    [0.03, 0.3, 0.42, 0.285, 0.15, 0],
    [0.03, 0.3, 0.42, -0.285, 0.15, 0],
  ] as const) mesh(new THREE.BoxGeometry(w, h, d), WOOD, [px, py, pz], g);
  g.updateMatrixWorld(true);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const p = new THREE.Vector3(-0.17 + i * 0.17, 0.04, -0.09 + j * 0.18).applyMatrix4(g.matrixWorld);
    rack.add(j ? 0 : 2, p.x, p.y, p.z);
  }
}

/** Lámpara de mesa o de pie; devuelve dónde está el foco. */
function lamp(parent: THREE.Object3D, x: number, y: number, z: number, floor = false): THREE.Vector3 {
  const metal = std("#2b2020", 0.4, { metalness: 0.5 });
  const stem = floor ? 1.45 : 0.36;
  mesh(new THREE.CylinderGeometry(floor ? 0.16 : 0.09, floor ? 0.18 : 0.1, 0.03, 20), metal, [x, y + 0.015, z], parent);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, stem, 8), metal, [x, y + stem / 2, z], parent);
  const shade = mesh(
    new THREE.CylinderGeometry(floor ? 0.13 : 0.08, floor ? 0.22 : 0.14, floor ? 0.24 : 0.15, 24, 1, true),
    std("#f3e3c8", 0.9, { side: THREE.DoubleSide, emissive: new THREE.Color("#ffb46b"), emissiveIntensity: 0.35 }),
    [x, y + stem + (floor ? 0.06 : 0.03), z],
    parent,
  );
  shade.castShadow = false;
  const bulb = mesh(
    new THREE.SphereGeometry(floor ? 0.05 : 0.035, 16, 8),
    new THREE.MeshStandardMaterial({ color: "#000000", emissive: new THREE.Color("#ffc58a"), emissiveIntensity: 3 }),
    [x, y + stem - 0.01, z],
    parent,
  );
  bulb.castShadow = false;
  return bulb.position.clone();
}

function plant(parent: THREE.Object3D, x: number, z: number, kind: "tall" | "bush", scale = 1): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  const clay = std("#b5653d", 0.85);
  mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.34, 18), clay, [0, 0.17, 0], g);
  mesh(new THREE.TorusGeometry(0.17, 0.02, 6, 18).rotateX(Math.PI / 2), clay, [0, 0.34, 0], g);
  mesh(new THREE.CircleGeometry(0.15, 16).rotateX(-Math.PI / 2), std("#3a2a22", 1), [0, 0.32, 0], g);
  const greens = ["#3e7a4a", "#2f6a3f", "#4d8b52", "#5f9a55"];
  if (kind === "tall") {
    // sansevieria: hojas largas y algo abiertas
    for (let i = 0; i < 9; i++) {
      const h = 0.55 + rnd() * 0.45;
      const leaf = mesh(new THREE.ConeGeometry(0.035, h, 4, 1).translate(0, h / 2, 0), std(pick(greens), 0.6, { flatShading: true }), [0, 0.3, 0], g);
      const a = (i / 9) * Math.PI * 2 + rnd() * 0.4;
      leaf.position.x = Math.cos(a) * 0.05;
      leaf.position.z = Math.sin(a) * 0.05;
      leaf.rotation.set(Math.sin(a) * 0.25, rnd() * Math.PI, -Math.cos(a) * 0.25);
      leaf.scale.z = 0.35;
    }
  } else {
    // ficus: tronco y copa de bolas facetadas
    mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.6, 6), std("#5b3a26", 0.9), [0, 0.6, 0], g);
    for (let i = 0; i < 7; i++) {
      const r = 0.14 + rnd() * 0.08;
      mesh(new THREE.IcosahedronGeometry(r, 0), std(pick(greens), 0.7, { flatShading: true }), [(rnd() - 0.5) * 0.3, 0.95 + rnd() * 0.3, (rnd() - 0.5) * 0.3], g);
    }
  }
}

function rug(parent: THREE.Object3D, x: number, z: number, w: number, d: number, palette: [string, string, string]): void {
  const [field, border, motif] = palette;
  const tex = canvasTexture(512, Math.round((512 * d) / w), (ctx) => {
    const W = ctx.canvas.width, H = ctx.canvas.height, r = 40;
    ctx.beginPath();
    ctx.roundRect(4, 4, W - 8, H - 8, r);
    ctx.fillStyle = border;
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(30, 30, W - 60, H - 60, r * 0.6);
    ctx.fillStyle = field;
    ctx.fill();
    // motivo de rombos, como un tejido
    ctx.strokeStyle = motif;
    ctx.lineWidth = 6;
    for (let x = 70; x < W - 60; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, H / 2 - 40);
      ctx.lineTo(x + 32, H / 2);
      ctx.lineTo(x, H / 2 + 40);
      ctx.lineTo(x - 32, H / 2);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.fillStyle = motif;
    ctx.fillRect(50, 46, W - 100, 6);
    ctx.fillRect(50, H - 52, W - 100, 6);
  });
  const m = mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), std("#ffffff", 0.95, { map: tex, alphaTest: 0.5 }), [x, 0.006, z], parent);
  m.castShadow = false;
}

/** Cuadro en la pared trasera (z = -3.425 es su cara). */
function frame(parent: THREE.Object3D, x: number, y: number, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void): void {
  const wall = -3.425;
  mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.04), WOOD_DARK, [x, y, wall + 0.02], parent);
  const tex = canvasTexture(512, Math.round((512 * h) / w), (ctx) => draw(ctx, ctx.canvas.width, ctx.canvas.height));
  mesh(new THREE.PlaneGeometry(w, h), std("#ffffff", 0.85, { map: tex }), [x, y, wall + 0.042], parent).castShadow = false;
}

const volcano = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  // Quetzaltenango: el Santa María al atardecer
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#f2b36b");
  sky.addColorStop(1, "#f5e6d0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.38, H * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#841c26";
  ctx.beginPath();
  ctx.moveTo(-10, H);
  ctx.lineTo(W * 0.42, H * 0.22);
  ctx.lineTo(W * 0.5, H * 0.26);
  ctx.lineTo(W + 10, H);
  ctx.fill();
  ctx.fillStyle = "#4a0e15";
  ctx.fillRect(0, H * 0.82, W, H * 0.18);
};

const abstract = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#f5f0eb";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2c6bd6";
  ctx.fillRect(W * 0.1, H * 0.15, W * 0.35, H * 0.7);
  ctx.fillStyle = "#841c26";
  ctx.beginPath();
  ctx.arc(W * 0.65, H * 0.45, H * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d4a53c";
  ctx.fillRect(W * 0.5, H * 0.72, W * 0.4, H * 0.08);
};

const bottlePoster = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#841c26";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f5f0eb";
  const cx = W / 2;
  ctx.beginPath();
  ctx.roundRect(cx - W * 0.14, H * 0.38, W * 0.28, H * 0.5, 18);
  ctx.fill();
  ctx.fillRect(cx - W * 0.05, H * 0.14, W * 0.1, H * 0.26);
  ctx.fillStyle = "#d4a53c";
  ctx.fillRect(cx - W * 0.14, H * 0.55, W * 0.28, H * 0.12);
  ctx.fillStyle = "#f5f0eb";
  ctx.font = `600 ${Math.round(H * 0.06)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText("Salud", cx, H * 0.08 + H * 0.02);
};

function mug(parent: THREE.Object3D, x: number, y: number, z: number, color: string): void {
  const m = std(color, 0.4);
  mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 16), m, [x, y + 0.05, z], parent);
  mesh(new THREE.TorusGeometry(0.03, 0.009, 6, 12), m, [x + 0.05, y + 0.055, z], parent).rotation.y = Math.PI / 2;
}

/** Hojas sueltas por el suelo: los reportes que nadie junta. */
function papers(parent: THREE.Object3D, x: number, z: number): void {
  const tex = canvasTexture(128, 170, (ctx) => {
    ctx.fillStyle = "#fbf8f2";
    ctx.fillRect(0, 0, 128, 170);
    ctx.fillStyle = "#841c26";
    ctx.fillRect(12, 12, 60, 8);
    ctx.fillStyle = "#9a9087";
    for (let y = 32; y < 158; y += 11) ctx.fillRect(12, y, 104 - ((y * 7) % 40), 4);
  });
  const paper = std("#ffffff", 0.95, { map: tex, side: THREE.DoubleSide });
  const spots: [number, number][] = [[-1.4, 0.5], [-1.0, 1.2], [1.1, 0.9], [1.5, 0.3], [-0.6, 1.7], [0.9, 1.6]];
  spots.forEach(([dx, dz], i) => {
    const p = mesh(new THREE.PlaneGeometry(0.3, 0.4).rotateX(-Math.PI / 2), paper, [x + dx, 0.004 + i * 0.0015, z + dz], parent);
    p.rotation.y = rnd() * Math.PI;
    p.castShadow = false;
  });
  // un par de bolas de papel arrugado
  for (const [dx, dz] of [[-1.7, 1.0], [1.3, 1.25]]) mesh(new THREE.IcosahedronGeometry(0.06, 0), std("#f3eee6", 0.9, { flatShading: true }), [x + dx, 0.05, z + dz], parent);
}

/** Cojines y brazos para que el bloque gris de la sala sea un sofá. */
function sofa(parent: THREE.Object3D, x: number, z: number): void {
  const fabric = std("#8a8f99", 0.95);
  const box = (w: number, h: number, d: number) => new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.3);
  for (const s of [-1, 1]) mesh(box(0.22, 0.72, 0.98), fabric, [x + s * 1.12, 0.36, z], parent);
  for (const s of [-1, 1]) {
    mesh(box(1.0, 0.16, 0.74), fabric, [x + s * 0.51, 0.68, z + 0.06], parent);
    mesh(box(0.98, 0.5, 0.2), fabric, [x + s * 0.51, 0.95, z - 0.3], parent).rotation.x = -0.12;
  }
  const pillow = (color: string, px: number, roll: number) => {
    const p = mesh(box(0.38, 0.38, 0.12), std(color, 0.9), [x + px, 0.93, z - 0.12], parent);
    p.rotation.set(-0.3, 0, roll);
  };
  pillow("#841c26", -0.7, 0.12);
  pillow("#d4a53c", 0.75, -0.1);
}

/** Cajas de pedido de cartón con cinta, en lugar de los bloques dorados. */
function parcel(box: THREE.Mesh, parent: THREE.Object3D): void {
  box.material = std("#b98a5a", 0.9);
  box.updateWorldMatrix(true, false);
  const size = new THREE.Box3().setFromObject(box).getSize(new THREE.Vector3());
  const at = box.getWorldPosition(new THREE.Vector3());
  const tape = std("#d9c08f", 0.6);
  mesh(new THREE.BoxGeometry(size.x + 0.004, 0.004, 0.07), tape, [at.x, at.y + size.y / 2 + 0.002, at.z], parent);
  mesh(new THREE.BoxGeometry(0.16, 0.1, 0.004), std("#fbf8f2", 0.9), [at.x - 0.06, at.y, at.z + size.z / 2 + 0.003], parent).castShadow = false;
}

// ---------- montaje ----------

export class Decor {
  private readonly bulbs: THREE.Vector3[] = [];
  private readonly lights: THREE.PointLight[] = [];
  private readonly glass: THREE.MeshPhysicalMaterial;

  constructor(scene: THREE.Scene, root: THREE.Object3D) {
    const group = new THREE.Group();
    group.name = "decor";
    scene.add(group);

    // superficies del modelo
    const hidden: THREE.Object3D[] = [];
    const parcels: THREE.Mesh[] = [];
    // ámbar de whisky: claro en los bordes, más denso en el centro
    this.glass = new THREE.MeshPhysicalMaterial({
      color: "#e9954a",
      roughness: 0.06,
      metalness: 0,
      transmission: 0.85,
      thickness: 0.2,
      ior: 1.5,
      attenuationColor: new THREE.Color("#c8661e"),
      attenuationDistance: 0.6,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.5,
    });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (/^shelf_(frame|bottle)/.test(m.name)) hidden.push(m);
      if (/^order_box/.test(m.name)) parcels.push(m);
      const mat = m.material as THREE.MeshStandardMaterial;
      if (/^bottle_(body|shoulder|neck)/.test(m.name)) m.material = this.glass;
      else if (mat.name.startsWith("wood")) surface(mat, "wood");
      else if (mat.name.startsWith("wall") || mat.name.startsWith("cream")) surface(mat, "plaster");
      else if (mat.name.startsWith("ground")) surface(mat, "ground");
    });
    for (const o of hidden) o.visible = false;
    for (const p of parcels) parcel(p, group);

    const rack = new BottleRack();
    const lamps = (p: THREE.Vector3) => this.bulbs.push(p);

    // 0 · sala del cliente: sofá con cojines, lámpara de pie, alfombra, cuadros sobre el sofá, planta
    sofa(group, sx(0) - 1.5, -1.0);
    lamps(lamp(group, sx(0) - 3.0, 0, -1.25, true));
    rug(group, sx(0) - 1.2, -0.15, 3.4, 1.9, ["#e9dcc4", "#841c26", "#d4a53c"]);
    frame(group, sx(0) - 2.45, 1.75, 0.62, 0.46, volcano);
    frame(group, sx(0) - 0.75, 1.75, 0.46, 0.46, abstract);
    plant(group, sx(0) + 2.7, -2.7, "tall");

    // 1 y 5 · tienda: estantería abierta llena, cajas con botellas, lámpara en el mostrador, planta
    for (const i of [1, 5]) {
      openShelf(group, sx(i), -2.6, rack);
      crate(group, sx(i) - 2.35, 0, -2.45, 0.25, rack);
      crate(group, sx(i) - 2.45, 0, -1.8, -0.3, rack);
      plant(group, sx(i) + 2.55, -2.65, "bush");
      lamps(lamp(group, sx(i) + (i === 1 ? -1.35 : 1.45), 1.06, -0.75));
    }

    // 2 · oficina de antes: lámpara, papeles por el suelo, planta
    lamps(lamp(group, sx(2) - 1.15, 0.94, -0.95));
    papers(group, sx(2), 0.4);
    plant(group, sx(2) + 2.6, -2.7, "tall", 0.9);

    // 4 · escritorio del cliente (en el modelo flota: se le ponen patas), lámpara, taza, alfombra, cuadro, planta
    for (const lx of [-1.2, 1.2]) for (const lz of [-1.32, -0.28]) mesh(new THREE.BoxGeometry(0.06, 0.76, 0.06), WOOD, [sx(4) + lx, 0.38, lz], group);
    lamps(lamp(group, sx(4) + 0.95, 0.84, -1.15));
    mug(group, sx(4) - 0.55, 0.84, -0.35, "#841c26");
    rug(group, sx(4), -0.1, 3.0, 2.6, ["#2f3b4c", "#d4a53c", "#5b7c99"]);
    frame(group, sx(4) + 2.2, 2.0, 0.5, 0.7, bottlePoster);
    plant(group, sx(4) - 2.4, -2.5, "bush", 0.9);

    // 6 · panel de la administradora: lámpara, taza, planta
    lamps(lamp(group, sx(6) - 1.1, 0.94, 0.05));
    mug(group, sx(6) + 0.45, 0.94, 0.45, "#f5f0eb");
    plant(group, sx(6) + 3.05, -1.7, "tall");

    rack.build(group);

    // dos luces reales que se mudan a las lámparas más cercanas a la cámara (el número fijo evita recompilar)
    for (let i = 0; i < 2; i++) {
      const l = new THREE.PointLight("#ffb46b", 0, 4.5, 2);
      scene.add(l);
      this.lights.push(l);
    }
  }

  setQuality(high: boolean): void {
    // la transmisión hace otra pasada de la escena: solo en calidad alta
    this.glass.transmission = high ? 0.85 : 0;
    this.glass.opacity = 1;
    this.glass.needsUpdate = true;
  }

  update(aim: THREE.Vector3): void {
    const near = this.bulbs
      .map((p) => ({ p, d: Math.hypot(p.x - aim.x, p.z - aim.z) }))
      .sort((a, b) => a.d - b.d);
    this.lights.forEach((l, i) => {
      const b = near[i];
      if (!b) return void (l.intensity = 0);
      l.position.copy(b.p);
      l.intensity = 0.55 * (1 - THREE.MathUtils.smoothstep(b.d, 3, 6));
    });
  }
}
