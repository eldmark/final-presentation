/**
 * Intro con mapa: de Guatemala a Quetzaltenango, las 3 sucursales con su foto y, al final,
 * un acercamiento que se disuelve en el render 3D de la tienda.
 * Los mosaicos están en public/map/tiles (tools/fetch-map-tiles.mjs): funciona sin internet.
 */
export interface Branch {
  id: string;
  name: string;
  address: string;
  note?: string;
  lat: number;
  lng: number;
  photo: string;
  card: "left" | "right" | "below";
}

export interface MapCfg {
  zoomStart: number;
  zoomCity: number;
  zoomCluster: number;
  zoomEnd: number;
  center: { lat: number; lng: number };
  focus: { lat: number; lng: number };
  attribution: string;
  branches: Branch[];
}

interface Cam {
  z: number;
  lat: number;
  lng: number;
}

const TILE = 256;
const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Píxeles de mundo (Web Mercator) para un nivel de zoom continuo. */
function project(lat: number, lng: number, z: number): [number, number] {
  const s = Math.sin((lat * Math.PI) / 180);
  const size = TILE * 2 ** z;
  return [((lng + 180) / 360) * size, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * size];
}

type Phase = "idle" | "zoom" | "pins" | "photos" | "final" | "done";

export class MapIntro {
  active = false;
  private phase: Phase = "idle";
  private readonly el: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly pins: HTMLElement[] = [];
  private readonly label: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly tiles = new Map<string, HTMLImageElement>();
  private cam: Cam;
  private tween: { from: Cam; to: Cam; t0: number; dur: number; onEnd: () => void } | null = null;
  private raf = 0;
  private timers: number[] = [];
  private auto = false;
  private onDone: () => void = () => undefined;
  private readonly dpr = Math.min(2, window.devicePixelRatio || 1);

  constructor(
    host: HTMLElement,
    private readonly cfg: MapCfg,
  ) {
    this.cam = { z: cfg.zoomStart, ...cfg.center };
    this.el = document.createElement("div");
    this.el.className = "mapintro";
    this.el.hidden = true;
    this.el.innerHTML = `
      <canvas></canvas>
      <div class="mi-shade"></div>
      <div class="mi-pins"></div>
      <div class="mi-label"><small>Bodega de Licores</small><b></b></div>
      <div class="mi-hint">→ para continuar</div>
      <div class="mi-attr">${esc(cfg.attribution)}</div>`;
    host.appendChild(this.el);
    this.canvas = this.el.querySelector("canvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    this.label = this.el.querySelector(".mi-label b")!;
    this.hint = this.el.querySelector(".mi-hint")!;
    const pinHost = this.el.querySelector(".mi-pins")!;
    for (const b of cfg.branches) {
      const pin = document.createElement("div");
      pin.className = `mi-pin ${b.card}`;
      pin.dataset.id = b.id;
      pin.innerHTML = `<i class="dot"></i><span class="name">${esc(b.name.replace("Sucursal ", ""))}</span>
        <figure class="mi-card"><img src="${esc(b.photo)}" alt="${esc(b.name)}" />
        <figcaption><b>${esc(b.name)}</b><span>${esc(b.address)}, Quetzaltenango${b.note ? ` · ${esc(b.note)}` : ""}</span></figcaption></figure>`;
      pinHost.appendChild(pin);
      this.pins.push(pin);
    }
    window.addEventListener("resize", () => this.active && this.draw());
  }

  /** Mosaicos y fotos a memoria antes de empezar, para que el zoom no se entrecorte. */
  async preload(onProgress: (done: number, total: number) => void): Promise<void> {
    const list: string[] = await fetch("map/tiles.json").then((r) => r.json()).catch(() => []);
    const photos = this.cfg.branches.map((b) => b.photo);
    const total = list.length + photos.length;
    let done = 0;
    const load = (src: string, key?: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          if (key && img.naturalWidth) this.tiles.set(key, img);
          onProgress(++done, total);
          resolve();
        };
        img.src = src;
      });
    const jobs = [...photos.map((p) => () => load(p)), ...list.map((t) => () => load(`map/tiles/${t}.png`, t))];
    const workers = Array.from({ length: 12 }, async () => {
      for (let j = jobs.shift(); j; j = jobs.shift()) await j();
    });
    await Promise.all(workers);
  }

  start(auto: boolean, onDone: () => void): void {
    this.auto = auto;
    this.onDone = onDone;
    this.active = true;
    this.phase = "zoom";
    this.cam = { z: this.cfg.zoomStart, ...this.cfg.center };
    this.el.hidden = false;
    this.el.classList.remove("fade");
    this.el.classList.remove("final");
    this.hint.classList.remove("on");
    this.pins.forEach((p) => p.classList.remove("on", "card-on"));
    this.setLabel("Guatemala");
    this.sizeCanvas();
    this.go({ z: this.cfg.zoomCluster, ...this.cfg.center }, 7500, () => this.afterZoom());
    // el nombre de la ciudad aparece cuando el mapa ya se acercó lo suficiente
    this.later(3600, () => this.setLabel("Quetzaltenango"));
    this.later(6300, () => this.pins.forEach((p, i) => this.later(i * 380, () => p.classList.add("on"))));
    const loop = () => {
      this.step(performance.now());
      this.draw();
      if (this.active) this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    // un navegador pausa requestAnimationFrame en ventanas ocultas; este reloj mantiene el recorrido
    this.timers.push(
      window.setInterval(() => {
        if (document.hidden && this.active) this.step(performance.now());
      }, 100),
    );
  }

  /** Siguiente paso de la intro (flecha, espacio o celular). */
  advance(): void {
    if (!this.active) return;
    if (this.phase === "zoom" && this.tween) {
      // saltar la animación inicial
      this.cam = { ...this.tween.to };
      const end = this.tween.onEnd;
      this.tween = null;
      this.setLabel("Quetzaltenango");
      this.pins.forEach((p) => p.classList.add("on"));
      end();
    } else if (this.phase === "pins") this.showPhotos();
    else if (this.phase === "photos") this.finalZoom();
  }

  private afterZoom(): void {
    this.phase = "pins";
    this.pins.forEach((p) => p.classList.add("on"));
    this.hint.classList.add("on");
    if (this.auto) this.later(1800, () => this.showPhotos());
  }

  private showPhotos(): void {
    if (this.phase !== "pins") return;
    this.phase = "photos";
    this.hint.classList.remove("on");
    this.pins.forEach((p, i) => this.later(i * 1100, () => p.classList.add("card-on")));
    this.later(this.pins.length * 1100 + 600, () => this.hint.classList.add("on"));
    if (this.auto) this.later(this.pins.length * 1100 + 5200, () => this.finalZoom());
  }

  private finalZoom(): void {
    if (this.phase !== "photos") return;
    this.phase = "final";
    this.hint.classList.remove("on");
    this.el.classList.add("final");
    this.setLabel("");
    this.go({ z: this.cfg.zoomEnd, ...this.cfg.focus }, 4200, () => this.finish());
    // el mapa se disuelve cuando ya casi llegó, y deja ver el render de la tienda
    this.later(3000, () => this.el.classList.add("fade"));
  }

  private finish(): void {
    this.phase = "done";
    this.later(900, () => {
      this.active = false;
      this.el.hidden = true;
      this.clearTimers();
      cancelAnimationFrame(this.raf);
      this.onDone();
    });
  }

  // ---------- movimiento ----------
  private go(to: Cam, dur: number, onEnd: () => void): void {
    this.tween = { from: { ...this.cam }, to, t0: performance.now(), dur, onEnd };
  }

  private step(now: number): void {
    const tw = this.tween;
    if (!tw) return;
    const k = Math.min(1, (now - tw.t0) / tw.dur);
    const e = ease(k);
    this.cam = {
      z: tw.from.z + (tw.to.z - tw.from.z) * e,
      lat: tw.from.lat + (tw.to.lat - tw.from.lat) * e,
      lng: tw.from.lng + (tw.to.lng - tw.from.lng) * e,
    };
    if (k >= 1) {
      this.tween = null;
      tw.onEnd();
    }
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach((t) => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    this.timers = [];
  }

  private setLabel(text: string): void {
    this.label.textContent = text;
    this.label.parentElement!.classList.toggle("on", Boolean(text));
  }

  // ---------- dibujo ----------
  private sizeCanvas(): void {
    const w = Math.round(window.innerWidth * this.dpr);
    const h = Math.round(window.innerHeight * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  private draw(): void {
    this.sizeCanvas();
    const { ctx, cam } = this;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.fillStyle = "#ece8e1";
    ctx.fillRect(0, 0, W, H);

    const lo = Math.round(this.cfg.zoomStart);
    const hi = Math.round(this.cfg.zoomEnd);
    const zi = Math.max(lo, Math.min(hi, Math.round(cam.z)));
    const s = 2 ** (cam.z - zi) * this.dpr;
    const [cx, cy] = project(cam.lat, cam.lng, zi);
    const n = 2 ** zi;
    const x0 = Math.floor((cx - W / 2 / s) / TILE);
    const x1 = Math.floor((cx + W / 2 / s) / TILE);
    const y0 = Math.max(0, Math.floor((cy - H / 2 / s) / TILE));
    const y1 = Math.min(n - 1, Math.floor((cy + H / 2 / s) / TILE));
    const size = Math.ceil(TILE * s) + 1;
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const img = this.tiles.get(`${zi}/${((x % n) + n) % n}/${y}`);
        if (!img) continue;
        ctx.drawImage(img, Math.floor(W / 2 + (x * TILE - cx) * s), Math.floor(H / 2 + (y * TILE - cy) * s), size, size);
      }
    }

    // marcadores: se proyectan al zoom continuo para que sigan al mapa
    const [px, py] = project(cam.lat, cam.lng, cam.z);
    this.cfg.branches.forEach((b, i) => {
      const [bx, by] = project(b.lat, b.lng, cam.z);
      const x = window.innerWidth / 2 + (bx - px);
      const y = window.innerHeight / 2 + (by - py);
      this.pins[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }
}
