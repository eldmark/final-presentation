import type { ContentData, TourData, TourSegment } from "./types";

const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Capa HTML encima del 3D: escena, subtítulos, citas, tarjetas, progreso y controles. */
export class Overlay {
  private readonly root: HTMLElement;
  private readonly pill: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly quote: HTMLElement;
  private readonly card: HTMLElement;
  private readonly bar: HTMLElement;
  private readonly fill: HTMLElement;
  private readonly clock: HTMLElement;
  private readonly playBtn: HTMLButtonElement;
  private readonly start: HTMLElement;
  private readonly disclaimer: HTMLElement;
  private lastKey = "";

  constructor(
    root: HTMLElement,
    private readonly tour: TourData,
    private readonly content: ContentData,
    handlers: {
      onStart: () => void;
      onToggle: () => void;
      onPrev: () => void;
      onNext: () => void;
      onSeek: (t: number) => void;
      onFullscreen: () => void;
    },
  ) {
    this.root = root;
    root.innerHTML = `
      <div class="pill" aria-live="polite"></div>
      <div class="quote" hidden></div>
      <figure class="card" hidden><img alt="" /><figcaption></figcaption></figure>
      <p class="subtitle" aria-live="polite" hidden></p>
      <div class="disclaimer" hidden></div>
      <div class="dock">
        <div class="bar" role="slider" aria-label="Progreso de la presentación" tabindex="0"
             aria-valuemin="0" aria-valuemax="${tour.duration}" aria-valuenow="0">
          <div class="fill"></div>
        </div>
        <div class="buttons">
          <button data-act="prev" aria-label="Escena anterior">⏮</button>
          <button data-act="toggle" aria-label="Pausar o reanudar">▶</button>
          <button data-act="next" aria-label="Escena siguiente">⏭</button>
          <span class="clock">0:00 / ${mmss(tour.duration)}</span>
          <span class="spacer"></span>
          <button data-act="text" aria-label="Texto grande" aria-pressed="false">A²</button>
          <button data-act="full" aria-label="Pantalla completa">⛶</button>
        </div>
      </div>
      <div class="start" role="dialog" aria-modal="true" aria-label="Inicio">
        <div class="start-card">
          <img class="logo" src="logo.png" alt="Bodega de Licores" />
          <h1>${content.title}</h1>
          <p class="sub">Del “¿cuánto cuesta?” al dato con el que decidimos</p>
          ${content.disclaimer.map((d) => `<p class="small">${d}</p>`).join("")}
          <button class="go" data-act="start">Empezar</button>
          <p class="hint">← → cambia de escena · Espacio pausa · F pantalla completa · A texto grande</p>
        </div>
      </div>`;

    this.pill = root.querySelector(".pill")!;
    this.subtitle = root.querySelector(".subtitle")!;
    this.quote = root.querySelector(".quote")!;
    this.card = root.querySelector(".card")!;
    this.bar = root.querySelector(".bar")!;
    this.fill = root.querySelector(".fill")!;
    this.clock = root.querySelector(".clock")!;
    this.playBtn = root.querySelector('[data-act="toggle"]')!;
    this.start = root.querySelector(".start")!;
    this.disclaimer = root.querySelector(".disclaimer")!;

    // marcas de escena en la barra
    for (const s of tour.segments) {
      const tick = document.createElement("i");
      tick.style.left = `${(s.start / tour.duration) * 100}%`;
      tick.title = `${mmss(s.start)} · ${s.speaker} · ${s.scene}`;
      this.bar.appendChild(tick);
    }

    root.addEventListener("click", (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>("[data-act]")?.dataset.act;
      if (act === "start") handlers.onStart();
      else if (act === "toggle") handlers.onToggle();
      else if (act === "prev") handlers.onPrev();
      else if (act === "next") handlers.onNext();
      else if (act === "full") handlers.onFullscreen();
      else if (act === "text") this.toggleLargeText();
    });
    this.bar.addEventListener("click", (e) => {
      const r = this.bar.getBoundingClientRect();
      handlers.onSeek(((e.clientX - r.left) / r.width) * tour.duration);
    });
  }

  toggleLargeText(force?: boolean): void {
    const on = force ?? !document.body.classList.contains("large-text");
    document.body.classList.toggle("large-text", on);
    this.root.querySelector('[data-act="text"]')?.setAttribute("aria-pressed", String(on));
  }

  hideStart(): void {
    this.start.hidden = true;
  }

  get started(): boolean {
    return Boolean(this.start.hidden);
  }

  private active<T extends { at: number; dur: number }>(items: T[], t: number): T | undefined {
    return items.find((i) => t >= i.at && t < i.at + i.dur);
  }

  update(t: number, seg: TourSegment, playing: boolean): void {
    this.fill.style.width = `${(t / this.tour.duration) * 100}%`;
    this.bar.setAttribute("aria-valuenow", String(Math.round(t)));
    this.clock.textContent = `${mmss(t)} / ${mmss(this.tour.duration)}`;
    this.playBtn.textContent = playing ? "⏸" : "▶";

    const sceneKey = `${seg.speaker}|${seg.scene}`;
    const content = this.content.segments[seg.id];

    const cue = content ? this.active(content.cues, t) : undefined;
    const quote = content ? this.active(content.quotes, t) : undefined;
    const card = content ? this.active(content.cards, t) : undefined;
    // el disclaimer aparece al inicio y durante el cierre
    const showDisclaimer = this.started && (t < 6 || (seg.id === "cierre" && t >= 780 && t < 804));
    const key = `${sceneKey}|${cue?.text}|${quote?.text}|${card?.image}|${showDisclaimer}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    this.pill.innerHTML = `<span>${seg.scene}</span><em>${seg.speaker}</em>`;

    this.subtitle.hidden = !cue;
    if (cue) this.subtitle.textContent = cue.text;

    this.quote.hidden = !quote;
    if (quote) {
      this.quote.innerHTML = `<small>${quote.who} · entrevista</small><blockquote>“${quote.text}”</blockquote>`;
    }

    this.card.hidden = !card;
    if (card) {
      this.card.querySelector("img")!.setAttribute("src", card.image);
      this.card.querySelector("figcaption")!.textContent = card.caption;
    }

    this.disclaimer.hidden = !showDisclaimer;
    if (showDisclaimer) {
      this.disclaimer.innerHTML = `<b>Sobre el diseño</b>${this.content.disclaimer.map((d) => `<span>${d}</span>`).join("")}`;
    }
  }
}
