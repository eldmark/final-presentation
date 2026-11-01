import QRCode from "qrcode";
import type { Chapter, Step, TourData } from "./types";

const clock = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

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
}

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
    const title = cover?.title ?? "Del “¿cuánto cuesta?” al dato con el que decidimos";
    const subtitle = cover?.subtitle ?? "Proyecto de Ingeniería de Software · Grupo 7 · UVG";
    root.innerHTML = `
      <div class="vignette"></div>
      <div class="dimmer" hidden></div>

      <div class="title-card" hidden>
        <span class="tc-num"></span>
        <div><h2 class="tc-title"></h2><p class="tc-who"></p></div>
      </div>

      <header class="pill" aria-live="polite">
        <span class="pill-title"></span><em class="pill-who"></em>
        <span class="dots" aria-hidden="true"></span>
      </header>

      <aside class="quote" hidden></aside>
      <figure class="card" hidden>
        <img alt="" />
        <img class="qr" alt="Código QR" hidden />
        <div class="facts" hidden></div>
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
          <dt>Inicio</dt><dd>Volver al principio</dd>
          <dt>H · ?</dt><dd>Esta ayuda</dd>
        </dl>
        <p>El control remoto de la sala suele enviar Av Pág y Re Pág: ya funcionan. También se puede controlar desde el celular (ver la vista del presentador).</p>
      </section>

      <div class="start" role="dialog" aria-modal="true" aria-label="Inicio">
        ${cover?.image ? `<img class="cover" src="${esc(cover.image)}" alt="" />` : ""}
        <div class="start-card">
          <img class="logo" src="logo.svg" alt="Bodega de Licores" />
          <h1>${esc(title)}</h1>
          <p class="sub">${esc(subtitle)}</p>
          <div class="start-actions">
            <button class="go" data-act="start-manual" disabled>Preparando…</button>
            <button class="go ghost" data-act="start-auto" disabled>Reproducción automática</button>
          </div>
          <div class="loadbar"><i></i></div>
          <p class="hint">Enter inicia · → avanza · H muestra los atajos</p>
          <p class="legal">Datos reales anonimizados · marca usada con autorización · más en «Acerca de» (tecla I)</p>
        </div>
      </div>`;

    for (const k of ["dimmer", "title-card", "tc-num", "tc-title", "tc-who", "pill", "pill-title", "pill-who", "dots", "quote", "card", "subtitle",
      "timer", "toast", "dock", "chapters", "step-info", "help", "start", "loadbar"]) {
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
      b.innerHTML = `<b>${c.number}</b><span>${esc(c.title)}</span><em>${esc(c.speaker)}</em>`;
      b.title = `${c.number} · ${c.title} — ${c.speaker}`;
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
    this.el.startManual.textContent = "Presentar paso a paso";
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

  hideStart(): void {
    this.el.start.hidden = true;
    this.root.classList.add("running");
    this.lastKey = ""; // fuerza el primer repintado, con la tarjeta de título de la escena 1
  }

  get started(): boolean {
    return Boolean(this.el.start.hidden);
  }

  private showTitleCard(chapter: Chapter): void {
    const card = this.el["title-card"];
    this.el["tc-num"].textContent = String(chapter.number);
    this.el["tc-title"].textContent = chapter.title;
    this.el["tc-who"].textContent = chapter.speaker;
    card.hidden = false;
    card.classList.remove("play");
    void card.offsetWidth; // reinicia la animación
    card.classList.add("play");
    window.clearTimeout(this.titleTimer);
    this.titleTimer = window.setTimeout(() => (card.hidden = true), 2800);
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

    const key = `${s.segIndex}|${s.stepInSeg}|${s.step.cue}|${s.step.quote?.text}|${s.step.card?.caption}|${this.started}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    this.el["step-info"].textContent = `Escena ${chapter.number}/${this.chapters.length} · paso ${s.stepInSeg + 1}/${s.stepsInSeg}`;
    this.chapterEls.forEach((el, i) => el.classList.toggle("active", this.chapters[i] === chapter));

    // tarjeta de título al entrar a una escena nueva
    if (this.started && chapter.number !== this.lastChapter) this.showTitleCard(chapter);
    if (this.started) this.lastChapter = chapter.number;

    this.el["pill-title"].textContent = `${chapter.number} · ${chapter.title}`;
    this.el["pill-who"].textContent = chapter.speaker;
    // con muchos pasos, una barrita en vez de puntos
    this.el.dots.innerHTML =
      s.stepsInSeg <= 12
        ? Array.from({ length: s.stepsInSeg }, (_, i) => `<i class="${i <= s.stepInSeg ? "on" : ""}"></i>`).join("")
        : `<u><s style="width:${((s.stepInSeg + 1) / s.stepsInSeg) * 100}%"></s></u>`;

    const card = s.step.card;
    const large = card?.layout === "large";
    const focused = Boolean(s.step.focus) || large;

    // con un acercamiento o una tarjeta grande el texto baja su opacidad para dejar ver lo que se muestra
    this.el.subtitle.hidden = !s.step.cue;
    this.el.subtitle.classList.toggle("dim", focused);
    if (s.step.cue) {
      this.el.subtitle.textContent = s.step.cue;
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
      const img = this.el.card.querySelector<HTMLImageElement>("img:not(.qr)")!;
      const qr = this.el.card.querySelector<HTMLImageElement>("img.qr")!;
      const facts = this.el.card.querySelector<HTMLElement>(".facts")!;
      this.el.card.className = `card layout-${card.layout ?? "left"}`;
      img.hidden = !card.image;
      facts.hidden = !card.facts;
      qr.hidden = !card.qr;
      if (card.image) img.setAttribute("src", card.image);
      if (card.facts) facts.innerHTML = card.facts.map((f) => `<div><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join("");
      if (card.qr) void this.qrFor(card.qr).then((data) => qr.setAttribute("src", data));
      this.el.card.querySelector("figcaption")!.textContent = card.caption;
    }
  }
}
