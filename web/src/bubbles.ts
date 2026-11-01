import * as THREE from "three";
import type { BubbleSpec } from "./types";
export { BUBBLE_SPECS } from "./bubbleSpecs";

const easeOutBack = (x: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Dibuja una burbuja de chat en un canvas y la devuelve como sprite. */
function makeBubble(spec: BubbleSpec): { sprite: THREE.Sprite; ratio: number } {
  const font = "600 46px 'Space Grotesk', system-ui, sans-serif";
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font;
  const textW = probe.measureText(spec.text).width;
  const w = Math.ceil(textW + 150);
  const h = 150;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const style = {
    cliente: { fill: "#D9FDD3", text: "#111B21", meta: "#667781" },
    tienda: { fill: "#FFFFFF", text: "#111B21", meta: "#667781" },
    sistema: { fill: "#FFEFC2", text: "#3B2F0A", meta: "#7A6A2E" },
  }[spec.from];

  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = style.fill;
  roundRect(ctx, 14, 10, w - 28, h - 34, 28);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.font = font;
  ctx.fillStyle = style.text;
  ctx.textBaseline = "middle";
  ctx.fillText(spec.text, 44, 60);

  if (spec.from === "cliente") {
    ctx.font = "500 26px system-ui, sans-serif";
    ctx.fillStyle = style.meta;
    ctx.textAlign = "right";
    ctx.fillText("✓✓", w - 44, h - 40);
    ctx.textAlign = "left";
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.renderOrder = 10;
  sprite.visible = false;
  return { sprite, ratio: w / h };
}

const BUBBLE_HEIGHT = 0.4;

/**
 * Burbujas de WhatsApp animadas por código (no están en el modelo de Blender).
 * Son una función pura del tiempo: se ven bien al saltar entre escenas.
 */
export class Bubbles {
  private readonly items: { spec: BubbleSpec; sprite: THREE.Sprite; origin: THREE.Vector3; ratio: number }[] = [];

  constructor(scene: THREE.Scene, specs: BubbleSpec[], spacing: number) {
    for (const spec of specs) {
      const { sprite, ratio } = makeBubble(spec);
      const x = spec.station * spacing;
      // columna dentro del cuadro de la cámara: el cliente a la derecha, la tienda a la izquierda
      const sideX = { cliente: 1.75, tienda: 0.35, sistema: 1.05 }[spec.from];
      const base = spec.station === 0 ? 1.85 : 2.35;
      const z = spec.station === 0 ? 0.35 : -0.2;
      const origin = new THREE.Vector3(x + sideX, base + spec.slot * 0.47, z);
      sprite.position.copy(origin);
      scene.add(sprite);
      this.items.push({ spec, sprite, origin, ratio });
    }
  }

  /** Muestra todas las burbujas un instante (precarga de texturas); `update` las vuelve a ocultar. */
  warm(): void {
    for (const { sprite, origin } of this.items) {
      sprite.visible = true;
      sprite.material.opacity = 1;
      sprite.position.copy(origin);
    }
  }

  update(t: number): void {
    for (const { spec, sprite, origin, ratio } of this.items) {
      const into = (t - spec.at) / 0.55;
      const out = (spec.until - t) / 0.4;
      if (into <= 0 || out <= 0) {
        sprite.visible = false;
        continue;
      }
      sprite.visible = true;
      const k = easeOutBack(Math.min(1, into));
      const fade = Math.min(1, out);
      sprite.material.opacity = fade;
      const h = BUBBLE_HEIGHT * Math.max(0.001, k);
      sprite.scale.set(h * ratio, h, 1);
      sprite.position.set(origin.x, origin.y + 0.04 * Math.sin(t * 1.8 + spec.slot), origin.z);
    }
  }
}
