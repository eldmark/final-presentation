import type { Chapter, ContentData, Step, TourData } from "./types";

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

/** Capa HTML encima del 3D. Todo el texto que ve el público pasa por aquí. */
export class Overlay {
  private readonly el: Record<string, HTMLElement> = {};
  private lastKey = "";
  private lastChapter = -1;
  private titleTimer = 0;
  private chapterEls: HTMLElement[] = [];

  constructor(
    private readonly root: HTMLElement,
    private readonly tour: TourData,
    private readonly content: ContentData,
    private readonly chapters: Chapter[],
    h: OverlayHandlers,
  ) {
    root.innerHTML = `
      <div class="vignette"></div>

      <div class="title-card" hidden>
        <span class="tc-num"></span>
        <div><h2 class="tc-title"></h2><p class="tc-who"></p></div>
      </div>

      <header class="pill" aria-live="polite">
        <span class="pill-title"></span><em class="pill-who"></em>
        <span class="dots" aria-hidden="true"></span>
      </header>

      <aside class="quote" hidden></aside>
      <figure class="card" hidden><img alt="" /><div class="facts" hidden></div><figcaption></figcaption></figure>
      <p class="subtitle" aria-live="polite" hidden></p>
      <section class="disclaimer" hidden></section>

      <div class="timer" title="Tiempo real de la presentación (T para ocultar)"></div>

      <footer class="dock">
        <nav class="chapters" aria-label="Escenas"></nav>
        <div class="buttons">
          <button data-act="prev" aria-label="Paso anterior" title="Anterior (←)">‹</button>
          <button data-act="next" aria-label="Paso siguiente" title="Siguiente (→ o Espacio)">›</button>
          <span class="step-info"></span>
          <span class="spacer"></span>
          <button data-act="mode" class="wide" aria-label="Cambiar entre paso a paso y automático" title="Modo (M)"></button>
          <button data-act="play" aria-label="Pausar o reanudar" title="Pausa (Espacio)" hidden>⏸</button>
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
          <dt>T</dt><dd>Mostrar u ocultar el cronómetro</dd>
          <dt>A</dt><dd>Texto grande</dd>
          <dt>F</dt><dd>Pantalla completa</dd>
          <dt>Inicio</dt><dd>Volver al principio</dd>
          <dt>H · ?</dt><dd>Esta ayuda</dd>
        </dl>
        <p>El control remoto de la sala suele enviar Av Pág y Re Pág: ya funcionan.</p>
      </section>

      <div class="start" role="dialog" aria-modal="true" aria-label="Inicio">
        <div class="start-card">
          <img class="logo" src="logo.svg" alt="Bodega de Licores" />
          <h1>Del “¿cuánto cuesta?” al dato con el que decidimos</h1>
          <p class="sub">Proyecto de Ingeniería de Software · Grupo 7 · UVG</p>
          ${content.disclaimer.map((d) => `<p class="legal">${esc(d)}</p>`).join("")}
          <div class="start-actions">
            <button class="go" data-act="start-manual">Presentar paso a paso</button>
            <button class="go ghost" data-act="start-auto">Reproducción automática</button>
          </div>
          <p class="hint">Enter inicia · → avanza · H muestra los atajos</p>
        </div>
      </div>`;

    for (const k of ["title-card", "tc-num", "tc-title", "tc-who", "pill", "pill-title", "pill-who", "dots", "quote", "card", "subtitle",
      "disclaimer", "timer", "dock", "chapters", "step-info", "help", "start"]) {
      this.el[k] = root.querySelector<HTMLElement>(`.${k}`)!;
    }
    this.el.modeBtn = root.querySelector<HTMLElement>('[data-act="mode"]')!;
    this.el.playBtn = root.querySelector<HTMLElement>('[data-act="play"]')!;

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
    });
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

    const key = `${s.segIndex}|${s.stepInSeg}|${s.step.cue}|${s.step.quote?.text}|${s.step.card?.image}|${this.started}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    this.el["step-info"].textContent = `Escena ${chapter.number}/${this.chapters.length} · paso ${s.stepInSeg + 1}/${s.stepsInSeg}`;
    this.chapterEls.forEach((el, i) => el.classList.toggle("active", this.chapters[i] === chapter));

    // tarjeta de título al entrar a una escena nueva
    if (this.started && chapter.number !== this.lastChapter) this.showTitleCard(chapter);
    if (this.started) this.lastChapter = chapter.number;

    this.el["pill-title"].textContent = `${chapter.number} · ${chapter.title}`;
    this.el["pill-who"].textContent = chapter.speaker;
    this.el.dots.innerHTML = Array.from({ length: s.stepsInSeg }, (_, i) => `<i class="${i <= s.stepInSeg ? "on" : ""}"></i>`).join("");

    this.el.subtitle.hidden = !s.step.cue;
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

    this.el.card.hidden = !s.step.card;
    if (s.step.card) {
      const card = s.step.card;
      const img = this.el.card.querySelector("img")!;
      const facts = this.el.card.querySelector<HTMLElement>(".facts")!;
      img.hidden = !card.image;
      facts.hidden = !card.facts;
      if (card.image) img.setAttribute("src", card.image);
      if (card.facts) facts.innerHTML = card.facts.map((f) => `<div><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join("");
      this.el.card.querySelector("figcaption")!.textContent = card.caption;
    }

    // el disclaimer completo sale en el cierre (y resumido en la pantalla de inicio)
    const showDisclaimer = this.started && seg.id === "cierre" && s.stepInSeg === s.stepsInSeg - 1;
    this.el.disclaimer.hidden = !showDisclaimer;
    if (showDisclaimer) {
      this.el.disclaimer.innerHTML = `<b>Sobre el diseño</b>${this.content.disclaimer.map((d) => `<span>${esc(d)}</span>`).join("")}`;
    }
  }
}
