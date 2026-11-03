import QRCode from "qrcode";
import type { Chapter, Logo, Step, TourData } from "./types";

const clock = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * Parte un texto en palabras que entran una tras otra (`step` ms entre palabras, a partir de `delay`).
 * Con `mask`, cada palabra sube desde detrás de una máscara (títulos); sin ella, aparece y se enfoca (subtítulos).
 */
const words = (text: string, step: number, delay: number, mask = false): string => {
  let i = 0;
  return text
    .split(/(\s+)/)
    .map((w) => {
      if (!w.trim()) return w;
      const d = `${delay + Math.min(i++ * step, 700)}ms`;
      return mask ? `<span class="w"><span style="--d:${d}">${esc(w)}</span></span>` : `<span class="w" style="--d:${d}">${esc(w)}</span>`;
    })
    .join("");
};

export interface OverlayHandlers {
  onStartManual: () => void;
  onStartAuto: () => void;
  onNext: () => void;
  onPrev: () => void;
  onChapter: (firstSeg: number) => void;
  onToggleMode: () => void;
  onTogglePlay: () => void;
  onFullscreen: () => void;
  onPresenter: () => void;
  onAbout: () => void;
}

export interface OverlayState {
  step: Step;
  segIndex: number;
  stepInSeg: number;
  stepsInSeg: number;
  time: number;
  auto: boolean;
  playing: boolean;
  elapsed: number; // segundos reales desde que se empezó
}

export interface Cover {
  image?: string;
  title?: string;
  subtitle?: string;
  team?: string[];
  meta?: string[];
}

const DEFAULT_TEAM = ["Marcelo Detlefsen", "Marco Díaz", "Lázaro Díaz", "Julián Divas", "Luis Ángel Girón", "Jorge Villeda"];
const DEFAULT_META = ["Universidad del Valle de Guatemala", "Ingeniería de Software · Sección 10 · Grupo 7", "3 de noviembre de 2026"];

/** Capa HTML encima del 3D. Todo el texto que ve el público pasa por aquí. */
export class Overlay {
  private readonly el: Record<string, HTMLElement> = {};
  private lastKey = "";
  private lastChapter = -1;
  private titleTimer = 0;
  private toastTimer = 0;
  private chapterEls: HTMLElement[] = [];
  private qrCache = new Map<string, string>();

  constructor(
    private readonly root: HTMLElement,
    private readonly tour: TourData,
    private readonly chapters: Chapter[],
    h: OverlayHandlers,
    cover: Cover | null,
  ) {
    const tagline = cover?.subtitle ?? "Del “¿cuánto cuesta?” al dato con el que decidimos";
    const team = cover?.team ?? DEFAULT_TEAM;
    const meta = cover?.meta ?? DEFAULT_META;
    root.innerHTML = `
      <div class="vignette"></div>
      <div class="dimmer" hidden></div>

      <div class="title-card" hidden>
        <i class="lb top"></i><i class="lb bot"></i>
        <div class="tc-inner">
          <span class="tc-kicker">Escena <span class="tc-num"></span> de ${this.chapters.length}</span>
          <h2 class="tc-title"></h2>
          <i class="tc-rule"></i>
        </div>
      </div>

      <header class="pill" aria-live="polite">
        <b class="pill-num" aria-hidden="true"></b>
        <span class="pill-title"></span>
        <span class="dots" aria-hidden="true"></span>
      </header>

      <aside class="quote" hidden></aside>
      <figure class="card" hidden>
        <img alt="" />
        <img class="qr" alt="Código QR" hidden />
        <div class="facts" hidden></div>
        <ul class="logos" hidden></ul>
        <div class="gallery" hidden></div>
        <p class="logo-use" hidden></p>
        <figcaption></figcaption>
      </figure>
      <p class="subtitle" aria-live="polite" hidden></p>

      <div class="timer" title="Tiempo real de la presentación (T para ocultar)"></div>
      <div class="toast" role="status" hidden></div>

      <footer class="dock">
        <nav class="chapters" aria-label="Escenas"></nav>
        <div class="buttons">
          <button data-act="prev" aria-label="Paso anterior" title="Anterior (←)">‹</button>
          <button data-act="next" aria-label="Paso siguiente" title="Siguiente (→ o Espacio)">›</button>
          <span class="step-info"></span>
          <span class="spacer"></span>
          <button data-act="mode" class="wide" aria-label="Cambiar entre paso a paso y automático" title="Modo (M)"></button>
          <button data-act="play" aria-label="Pausar o reanudar" title="Pausa (Espacio)" hidden>⏸</button>
          <button data-act="presenter" class="wide" aria-label="Abrir la vista del presentador" title="Vista del presentador (P)">Presentador</button>
          <button data-act="about" class="wide" aria-label="Acerca del diseño, los datos y los modelos" title="Acerca de (I)">Acerca de</button>
          <button data-act="text" aria-label="Texto grande" aria-pressed="false" title="Texto grande (A)">A²</button>
          <button data-act="help" aria-label="Ayuda de teclado" title="Ayuda (H)">?</button>
          <button data-act="full" aria-label="Pantalla completa" title="Pantalla completa (F)">⛶</button>
        </div>
      </footer>

      <section class="help" hidden role="dialog" aria-label="Atajos de teclado">
        <h3>Atajos</h3>
        <dl>
          <dt>→ · Espacio · Av Pág</dt><dd>Siguiente paso</dd>
          <dt>← · Re Pág</dt><dd>Paso anterior</dd>
          <dt>Shift + → / ←</dt><dd>Escena siguiente / anterior</dd>
          <dt>M</dt><dd>Paso a paso ↔ automático</dd>
          <dt>P</dt><dd>Vista del presentador (segunda ventana)</dd>
          <dt>I</dt><dd>Acerca de: diseño, datos y modelos 3D</dd>
          <dt>T</dt><dd>Mostrar u ocultar el cronómetro</dd>
          <dt>A</dt><dd>Texto grande</dd>
          <dt>F</dt><dd>Pantalla completa</dd>
          <dt>Q</dt><dd>Calidad alta ↔ básica (si el equipo va lento)</dd>
          <dt>Inicio</dt><dd>Volver al principio</dd>
          <dt>H · ?</dt><dd>Esta ayuda</dd>
        </dl>
        <p>El control remoto de la sala suele enviar Av Pág y Re Pág: ya funcionan. También se puede controlar desde el celular (ver la vista del presentador).</p>
      </section>

      <div class="curtain" aria-hidden="true">
        <div class="drape l"></div><div class="drape r"></div><div class="valance"></div>
      </div>

      <div class="start" role="dialog" aria-modal="true" aria-label="Portada">
        ${cover?.image ? `<img class="cover" src="${esc(cover.image)}" alt="" />` : ""}
        <i class="halftone ht-tr"></i><i class="halftone ht-bl"></i>
        <header class="cv-top">
          <img class="logo" src="logo.svg" alt="Bodega de Licores" />
          <span>${esc(meta[1] ?? "")}</span>
        </header>
        <div class="cv-body">
          <p class="kicker">Proyecto final</p>
          <h1>${cover?.title ? esc(cover.title) : "Bodega de <b>Licores</b>"}</h1>
          <p class="tagline">${esc(tagline)}</p>
          <ul class="team" aria-label="Equipo">${team.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
          <div class="cv-actions">
            <button class="pill-btn" data-act="start-manual" disabled>Preparando…</button>
            <button class="link-btn" data-act="start-auto" disabled>Reproducción automática</button>
          </div>
          <div class="loadbar"><i></i></div>
        </div>
        <footer class="cv-foot">
          <span>${esc(meta[0] ?? "")}</span><span>${esc(meta[1] ?? "")}</span><span>${esc(meta[2] ?? "")}</span>
          <em>Datos reales anonimizados · marca usada con autorización · más en «Acerca de» (tecla I)</em>
        </footer>
      </div>`;

    for (const k of ["dimmer", "title-card", "tc-num", "tc-title", "pill", "pill-num", "pill-title", "dots", "quote", "card", "subtitle",
      "timer", "toast", "dock", "chapters", "step-info", "help", "start", "loadbar", "curtain"]) {
      this.el[k] = root.querySelector<HTMLElement>(`.${k}`)!;
    }
    this.el.modeBtn = root.querySelector<HTMLElement>('[data-act="mode"]')!;
    this.el.playBtn = root.querySelector<HTMLElement>('[data-act="play"]')!;
    this.el.startManual = root.querySelector<HTMLElement>('[data-act="start-manual"]')!;
    this.el.startAuto = root.querySelector<HTMLElement>('[data-act="start-auto"]')!;

    // capítulos: una pastilla por escena, ancho proporcional a su duración
    this.chapters.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chapter";
      b.style.flexGrow = String(c.end - c.start);
      b.innerHTML = `<b>${c.number}</b><span>${esc(c.title)}</span>`;
      b.title = `${c.number} · ${c.title}`;
      b.addEventListener("click", () => h.onChapter(c.firstSeg));
      this.el.chapters.appendChild(b);
      this.chapterEls.push(b);
    });

    root.addEventListener("click", (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>("[data-act]")?.dataset.act;
      if (act === "start-manual") h.onStartManual();
      else if (act === "start-auto") h.onStartAuto();
      else if (act === "next") h.onNext();
      else if (act === "prev") h.onPrev();
      else if (act === "mode") h.onToggleMode();
      else if (act === "play") h.onTogglePlay();
      else if (act === "full") h.onFullscreen();
      else if (act === "text") this.toggleLargeText();
      else if (act === "help") this.toggleHelp();
      else if (act === "presenter") h.onPresenter();
      else if (act === "about") h.onAbout();
    });
  }

  /** Avance de la precarga (0 a 1). Hasta que llega a 1 no se puede empezar. */
  setProgress(p: number): void {
    const pct = Math.round(p * 100);
    this.el.loadbar.querySelector<HTMLElement>("i")!.style.width = `${pct}%`;
    if (p < 1) this.el.startManual.textContent = `Preparando… ${pct} %`;
  }

  setReady(): void {
    this.el.loadbar.classList.add("done");
    for (const b of [this.el.startManual, this.el.startAuto]) (b as HTMLButtonElement).disabled = false;
    this.el.startManual.textContent = "Presentar";
  }

  toast(msg: string): void {
    this.el.toast.textContent = msg;
    this.el.toast.hidden = false;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (this.el.toast.hidden = true), 5000);
  }

  toggleLargeText(force?: boolean): void {
    const on = force ?? !document.body.classList.contains("large-text");
    document.body.classList.toggle("large-text", on);
    this.root.querySelector('[data-act="text"]')?.setAttribute("aria-pressed", String(on));
  }

  toggleHelp(force?: boolean): void {
    this.el.help.hidden = !(force ?? Boolean(this.el.help.hidden));
  }

  toggleTimer(): void {
    this.el.timer.classList.toggle("on");
  }

  showTimer(): void {
    this.el.timer.classList.add("on");
  }

  private intro = false;
  private firstTitle = true;

  /**
   * Portada → telón cerrado → el telón se abre y arranca la presentación.
   * `begin` se llama justo cuando el telón empieza a abrirse.
   */
  playIntro(begin: () => void): void {
    if (this.intro || this.started) return;
    this.intro = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.el.curtain.hidden = true;
      this.firstTitle = false;
      begin();
      return;
    }
    this.el.start.classList.add("leaving"); // la portada se desvanece y deja ver el telón
    window.setTimeout(() => {
      this.el.curtain.classList.add("open");
      begin();
      window.setTimeout(() => (this.el.curtain.hidden = true), 3200);
    }, 1500);
  }

  private demo: { el: HTMLVideoElement; from: number; until: number; on: boolean } | null = null;

  /** Video de demo mudo y en bucle, visible solo entre `from` y `until` (tiempo del recorrido). */
  setDemo(cfg: { src: string; from: number; until: number }): void {
    const el = document.createElement("video");
    el.className = "demo-video";
    // WebM primero (lo reproduce cualquier Chromium/Firefox) y MP4 de respaldo (Safari)
    const base = cfg.src.replace(/\.[^.]+$/, "");
    for (const [ext, type] of [["webm", "video/webm"], ["mp4", "video/mp4"]]) {
      const src = document.createElement("source");
      src.src = `${base}.${ext}`;
      src.type = type;
      el.appendChild(src);
    }
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = "auto";
    el.hidden = true;
    el.setAttribute("aria-label", "Demostración rápida del sitio");
    this.root.appendChild(el);
    this.demo = { el, from: cfg.from, until: cfg.until, on: false };
  }

  private updateDemo(time: number): void {
    const d = this.demo;
    if (!d) return;
    const want = this.started && time >= d.from && time < d.until;
    if (want === d.on) return;
    d.on = want;
    d.el.hidden = !want;
    if (want) void d.el.play().catch(() => undefined);
    else {
      d.el.pause();
      d.el.currentTime = 0;
    }
  }

  /** Tras el mapa no hay telón que esperar: la cinta de la escena 1 sale enseguida. */
  skipTitleDelay(): void {
    this.firstTitle = false;
  }

  /** Salta la portada y el telón (para ensayos con ?autoplay=1). */
  skipIntro(): void {
    this.el.curtain.hidden = true;
    this.firstTitle = false;
    this.intro = true;
  }

  hideStart(): void {
    this.el.start.hidden = true;
    this.root.classList.add("running");
    this.lastKey = ""; // fuerza el primer repintado, con la tarjeta de título de la escena 1
  }

  get started(): boolean {
    return Boolean(this.el.start.hidden);
  }

  private showTitleCard(chapter: Chapter): void {
    // mientras la cinta de la escena está en pantalla, la cita, la tarjeta y el subtítulo esperan
    this.root.classList.add("titling");
    // la primera tarjeta ("1 · El antes") espera a que el telón se haya abierto un poco
    if (this.firstTitle) {
      this.firstTitle = false;
      window.setTimeout(() => this.showTitleCard(chapter), 1300);
      return;
    }
    const card = this.el["title-card"];
    this.el["tc-num"].textContent = String(chapter.number);
    this.el["tc-title"].innerHTML = words(chapter.title, 70, 260, true);
    card.hidden = false;
    card.classList.remove("play");
    void card.offsetWidth; // reinicia la animación
    card.classList.add("play");
    window.clearTimeout(this.titleTimer);
    this.titleTimer = window.setTimeout(() => {
      card.hidden = true;
      this.root.classList.remove("titling");
    }, 2800);
  }

  /** Cada logo explica para qué se usó: al pasar el cursor, con el foco (Tab) o con la rueda del mouse. */
  private setupLogos(grid: HTMLElement, useEl: HTMLElement, logos: Logo[], groups?: { id: string; title: string }[]): void {
    const li = (l: Logo, i: number) => `<li tabindex="0" data-i="${i}"><img src="${esc(l.src)}" alt="" /><span>${esc(l.name)}</span></li>`;
    grid.innerHTML = groups?.length
      ? groups
          .map((g) => {
            const rows = logos.map((l, i) => (l.group === g.id ? li(l, i) : "")).join("");
            return rows ? `<li class="grp" aria-hidden="true">${esc(g.title)}</li>${rows}` : "";
          })
          .join("")
      : logos.map(li).join("");
    grid.classList.toggle("few", logos.length < 5);
    grid.classList.toggle("grouped", Boolean(groups?.length));
    grid.style.gridTemplateColumns = logos.length < 8 ? `repeat(${logos.length}, 1fr)` : "";
    const items = [...grid.querySelectorAll<HTMLElement>("li[data-i]")].sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
    const hint = "Pasa el cursor o gira la rueda sobre un logo para ver para qué lo usamos";
    let cur = -1;
    const show = (i: number) => {
      cur = i;
      items.forEach((el, k) => el.classList.toggle("on", k === i));
      const l = logos[i];
      useEl.innerHTML = l?.use ? `<b>${esc(l.name)}</b> · ${esc(l.use)}` : esc(hint);
    };
    items.forEach((el, i) => {
      el.addEventListener("mouseenter", () => show(i));
      el.addEventListener("focus", () => show(i));
    });
    grid.addEventListener("mouseleave", () => show(-1));
    grid.onwheel = (e) => {
      e.preventDefault();
      show(Math.max(0, Math.min(items.length - 1, (cur < 0 ? (e.deltaY > 0 ? -1 : items.length) : cur) + (e.deltaY > 0 ? 1 : -1))));
    };
    show(-1);
  }

  private async qrFor(url: string): Promise<string> {
    const hit = this.qrCache.get(url);
    if (hit) return hit;
    const data = await QRCode.toDataURL(url, { margin: 1, width: 640, color: { dark: "#2b2020", light: "#ffffff" } });
    this.qrCache.set(url, data);
    return data;
  }

  update(s: OverlayState): void {
    const seg = this.tour.segments[s.segIndex];
    const chapter = this.chapters.find((c) => parseInt(seg.scene, 10) === c.number)!;

    // cronómetro y estado del modo (cambian cada cuadro, son baratos)
    this.el.timer.textContent = `${clock(s.elapsed)} / 14:00`;
    this.el.timer.classList.toggle("warn", s.elapsed >= 12.5 * 60);
    this.el.timer.classList.toggle("over", s.elapsed >= 14 * 60);
    this.el.modeBtn.textContent = s.auto ? "Automático" : "Paso a paso";
    (this.el.playBtn as HTMLButtonElement).hidden = !s.auto;
    this.el.playBtn.textContent = s.playing ? "⏸" : "▶";

    this.updateDemo(s.time);
    const key = `${s.segIndex}|${s.stepInSeg}|${s.step.cue}|${s.step.quote?.text}|${s.step.card?.caption}|${this.started}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    this.el["step-info"].textContent = `Escena ${chapter.number}/${this.chapters.length} · paso ${s.stepInSeg + 1}/${s.stepsInSeg}`;
    this.chapterEls.forEach((el, i) => el.classList.toggle("active", this.chapters[i] === chapter));

    // tarjeta de título al entrar a una escena nueva
    if (this.started && chapter.number !== this.lastChapter) this.showTitleCard(chapter);
    if (this.started) this.lastChapter = chapter.number;

    this.el["pill-num"].textContent = String(chapter.number);
    this.el["pill-title"].textContent = chapter.title;
    // con muchos pasos, una barrita en vez de puntos
    this.el.dots.innerHTML =
      s.stepsInSeg <= 12
        ? Array.from({ length: s.stepsInSeg }, (_, i) => `<i class="${i <= s.stepInSeg ? "on" : ""}"></i>`).join("")
        : `<u><s style="width:${((s.stepInSeg + 1) / s.stepsInSeg) * 100}%"></s></u>`;

    const card = s.step.card;
    const large = card?.layout === "large" || card?.layout === "gallery";
    const focused = Boolean(s.step.focus);

    // una tarjeta grande ya lleva su propio texto: el subtítulo se esconde para no encimarse con ella;
    // con un acercamiento a una pantalla, baja su opacidad para dejar verla
    this.el.subtitle.hidden = !s.step.cue || large || Boolean(card?.logos);
    this.el.subtitle.classList.toggle("dim", focused);
    if (s.step.cue) {
      this.el.subtitle.innerHTML = words(s.step.cue, 38, 0);
      this.el.subtitle.classList.remove("pop");
      void this.el.subtitle.offsetWidth;
      this.el.subtitle.classList.add("pop");
    }

    this.el.quote.hidden = !s.step.quote;
    if (s.step.quote) {
      this.el.quote.innerHTML = `<span class="qm">“</span><blockquote>${esc(s.step.quote.text)}</blockquote><small>${esc(s.step.quote.who)} · entrevista</small>`;
    }

    this.el.card.hidden = !card;
    this.el.dimmer.hidden = !large;
    if (card) {
      const img = this.el.card.querySelector<HTMLImageElement>(":scope > img:not(.qr)")!;
      const qr = this.el.card.querySelector<HTMLImageElement>("img.qr")!;
      const facts = this.el.card.querySelector<HTMLElement>(".facts")!;
      this.el.card.className = `card layout-${card.layout ?? "left"}`;
      img.hidden = !card.image;
      facts.hidden = !card.facts;
      qr.hidden = !card.qr;
      const logos = this.el.card.querySelector<HTMLElement>(".logos")!;
      const useEl = this.el.card.querySelector<HTMLElement>(".logo-use")!;
      logos.hidden = !card.logos;
      useEl.hidden = !card.logos;
      const gallery = this.el.card.querySelector<HTMLElement>(".gallery")!;
      gallery.hidden = !card.gallery;
      if (card.gallery) {
        gallery.innerHTML = card.gallery
          .map((g) => `<figure><img src="${esc(g.src)}" alt="${esc(g.label)}" /><span>${esc(g.label)}</span></figure>`)
          .join("");
      }
      if (card.logos) this.setupLogos(logos, useEl, card.logos, card.groups);
      if (card.image) img.setAttribute("src", card.image);
      if (card.facts) facts.innerHTML = card.facts.map((f) => `<div><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join("");
      if (card.qr) void this.qrFor(card.qr).then((data) => qr.setAttribute("src", data));
      this.el.card.querySelector("figcaption")!.textContent = card.caption;
    }
  }
}
