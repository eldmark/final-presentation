import * as THREE from "three";

/**
 * Etiquetas que brotan en cada escena (icono + texto), suben y se desvanecen: cuentan lo que pasa
 * sin números inventados. Solo sale la de la estación que se está mirando, y se callan mientras la
 * cámara está encima de una pantalla. En la estación de los datos, además, viajan pulsos por las tuberías.
 */
type Tone = "wine" | "green" | "amber" | "slate";
type Message = [text: string, icon: string, tone: Tone];

const TONES: Record<Tone, { bg: string; dark: string; icon: string }> = {
  wine: { bg: "#9b2232", dark: "#5e0f19", icon: "#ffd166" },
  green: { bg: "#23784f", dark: "#11432b", icon: "#d9fdd3" },
  amber: { bg: "#a8661a", dark: "#5c360b", icon: "#fff1c9" },
  slate: { bg: "#4a3f46", dark: "#241d22", icon: "#f5f0eb" },
};

interface Emitter {
  station: number;
  at: THREE.Vector3[]; // puntos de donde brotan (se elige uno al azar)
  spread: number; // desorden horizontal, en metros
  messages: Message[];
  every: [number, number]; // segundos entre una y otra
  next: number;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Estaciones cada 9 m en X (ver blender/01_greybox.py); en Three la «y» de Blender es -z. */
const EMITTERS: Omit<Emitter, "next">[] = [
  // 1 · el cliente espera en la banqueta (sobre su cabeza: la cita ocupa la esquina izquierda)
  { station: 0, at: [v(0.15, 2.05, 1.15)], spread: 0.15, every: [2.4, 3.6], messages: [["Visto", "✓", "slate"], ["Sin respuesta", "…", "amber"], ["Esperando…", "?", "slate"]] },
  // 2 · la tienda de antes: todo llega a la vez
  { station: 1, at: [v(10.6, 1.6, 0.0)], spread: 0.2, every: [1.7, 2.6], messages: [["Llamada perdida", "!", "wine"], ["Mensajes sin leer", "!", "amber"], ["¿Hay en bodega?", "?", "slate"]] },
  // 3 · el administrador de antes, sin datos
  { station: 2, at: [v(18, 1.75, -0.4)], spread: 1.0, every: [2.2, 3.2], messages: [["¿Qué compro?", "?", "slate"], ["Reporte suelto", "!", "amber"], ["¿Qué no se mueve?", "?", "slate"]] },
  // 4 · los datos se juntan
  { station: 3, at: [v(25.5, 2.1, 0.5), v(28.5, 2.1, 0.5)], spread: 0.1, every: [2.2, 3.2], messages: [["Sincronizado", "✓", "green"], ["Una sola base", "✓", "green"]] },
  // 5 · el cliente compra
  { station: 4, at: [v(36, 1.95, -0.9)], spread: 0.35, every: [2.0, 3.0], messages: [["Agregado al carrito", "+", "wine"], ["Guardado en favoritos", "♥", "wine"], ["Reserva hecha", "✓", "green"]] },
  // 6 · el pedido llega a la tienda
  { station: 5, at: [v(45.9, 1.75, -0.45)], spread: 0.25, every: [2.0, 3.0], messages: [["Nuevo pedido", "+", "wine"], ["Reserva confirmada", "✓", "green"], ["Listo para recoger", "✓", "green"]] },
  // 7 · el administrador decide (a los lados de la pared de monitores, sin tapar las pantallas)
  { station: 6, at: [v(50.95, 1.9, -2.2), v(57.05, 1.9, -2.2)], spread: 0.08, every: [1.8, 2.8], messages: [["Stock crítico", "!", "amber"], ["Oferta lista", "✓", "green"], ["Campaña enviada", "↗", "wine"], ["Reporte al día", "✓", "green"]] },
  // 9 · cierre: las tres sucursales en línea
  { station: 8, at: [v(70.2, 1.75, -1.2), v(72.6, 1.75, 0.4), v(73.8, 1.75, -1.8)], spread: 0.05, every: [1.6, 2.4], messages: [["Sucursal en línea", "✓", "green"]] },
];

/** Tuberías de la estación de datos: de cada sucursal a la base central. */
const PIPES: [THREE.Vector3, THREE.Vector3][] = [200, 270, 340].map((deg) => {
  const a = THREE.MathUtils.degToRad(deg);
  return [v(27 + 3 * Math.cos(a), 0.12, -3 * Math.sin(a)), v(27, 0.12, 0)];
});

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const easeOutBack = (x: number) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);

const HEIGHT = 0.21; // m
const LIFE = 2.3; // s

interface Live {
  sprite: THREE.Sprite;
  ratio: number;
  from: THREE.Vector3;
  age: number;
}

export class Popups {
  private readonly group = new THREE.Group();
  private readonly emitters: Emitter[];
  private readonly textures = new Map<string, { tex: THREE.Texture; ratio: number }>();
  private readonly live: Live[] = [];
  private readonly pool: THREE.Sprite[] = [];
  private readonly pulses: { mesh: THREE.Mesh; pipe: number; phase: number }[] = [];
  private time = 0;

  constructor(scene: THREE.Scene) {
    this.group.name = "popups";
    scene.add(this.group);
    this.emitters = EMITTERS.map((e) => ({ ...e, next: rnd(0.3, 1.2) }));
    const pulseMat = new THREE.MeshBasicMaterial({ color: "#8fd0ff" });
    PIPES.forEach((_, pipe) => {
      for (let k = 0; k < 3; k++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), pulseMat);
        mesh.userData.noAO = true;
        this.group.add(mesh);
        this.pulses.push({ mesh, pipe, phase: k / 3 + pipe * 0.11 });
      }
    });
  }

  /** Dibuja la etiqueta una vez (pastilla con icono en círculo) y la reutiliza. */
  private texture(text: string, icon: string, tone: Tone): { tex: THREE.Texture; ratio: number } {
    const key = `${tone}|${icon}|${text}`;
    const hit = this.textures.get(key);
    if (hit) return hit;
    const H = 112, R = H / 2, pad = 14;
    const font = "600 50px Poppins, system-ui, sans-serif";
    const probe = document.createElement("canvas").getContext("2d")!;
    probe.font = font;
    const W = Math.ceil(pad + (H - pad * 2) + 22 + probe.measureText(text).width + 40);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const t = TONES[tone];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, t.bg);
    g.addColorStop(1, t.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(2, 2, W - 4, H - 4, R - 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 3;
    ctx.stroke();
    // icono en un círculo claro
    const cx = pad + (H - pad * 2) / 2;
    ctx.fillStyle = t.icon;
    ctx.beginPath();
    ctx.arc(cx, R, R - pad, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.dark;
    ctx.font = "700 50px Poppins, 'Segoe UI Symbol', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, cx, R + 3);
    ctx.fillStyle = "#ffffff";
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.fillText(text, pad + (H - pad * 2) + 22, R + 3);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const out = { tex, ratio: W / H };
    this.textures.set(key, out);
    return out;
  }

  /** Una etiqueta que brota en `at` (también la usa la escena de seguridad). */
  burst(at: THREE.Vector3, [text, icon, tone]: Message): void {
    const { tex, ratio } = this.texture(text, icon, tone);
    const sprite =
      this.pool.pop() ??
      new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false, color: new THREE.Color(0.88, 0.88, 0.88) }));
    sprite.material.map = tex;
    sprite.material.needsUpdate = true;
    sprite.renderOrder = 12;
    sprite.visible = true;
    this.group.add(sprite);
    this.live.push({ sprite, ratio, from: at.clone(), age: 0 });
  }

  /** aim: lo que mira la cámara; focused: la cámara está encima de una pantalla. */
  update(dt: number, aim: THREE.Vector3, focused: boolean): void {
    this.time += dt;
    const station = Math.round(aim.x / 9);
    const near = Math.abs(aim.x - station * 9) < 4.5;
    for (const e of this.emitters) {
      e.next -= dt;
      if (e.next > 0) continue;
      e.next = rnd(...e.every);
      if (focused || !near || e.station !== station) continue;
      const at = e.at[Math.floor(Math.random() * e.at.length)].clone();
      at.x += rnd(-e.spread, e.spread);
      this.burst(at, e.messages[Math.floor(Math.random() * e.messages.length)]);
    }

    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.age += focused ? dt * 4 : dt; // con una pantalla de cerca, se van rápido
      const t = p.age / LIFE;
      if (t >= 1) {
        p.sprite.visible = false;
        this.pool.push(p.sprite);
        this.live.splice(i, 1);
        continue;
      }
      const s = t < 0.16 ? Math.max(0.01, easeOutBack(t / 0.16)) : 1;
      p.sprite.scale.set(HEIGHT * p.ratio * s, HEIGHT * s, 1);
      p.sprite.position.copy(p.from).y += 0.42 * t;
      p.sprite.material.opacity = t > 0.72 ? (1 - t) / 0.28 : Math.min(1, t / 0.08);
    }

    // pulsos de datos por las tuberías hacia la base central
    for (const p of this.pulses) {
      const u = (this.time * 0.32 + p.phase) % 1;
      const [a, b] = PIPES[p.pipe];
      p.mesh.position.lerpVectors(a, b, u);
      p.mesh.scale.setScalar(Math.sin(u * Math.PI) * 0.9 + 0.1);
    }
  }
}
