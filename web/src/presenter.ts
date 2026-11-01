import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/playfair-display/700.css";
import "./presenter.css";
import { BUBBLE_SPECS } from "./bubbleSpecs";
import { buildChapters, buildSteps } from "./steps";
import { openChannel, type Cmd, type Msg, type StateMsg } from "./sync";
import type { Chapter, ContentData, Step, TourData } from "./types";

interface Notes {
  ideas: string[];
  data: string[];
  avoid: string[];
  handoff: string;
}

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const clock = (s: number): string => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

/** Texto corto de lo que el público ve en un paso. */
function describeStep(s: Step | undefined): string {
  if (!s) return "Fin de la presentación";
  const parts: string[] = [];
  if (s.bubbles?.length) parts.push(`💬 Burbuja: “${s.bubbles.join(" · ")}”`);
  if (s.cue) parts.push(`Subtítulo: ${s.cue}`);
  if (s.quote) parts.push(`Cita (${s.quote.who}): “${s.quote.text}”`);
  if (s.card) parts.push(`Tarjeta: ${s.card.caption}`);
  if (!parts.length) parts.push(s.arrival ? "La cámara llega a la estación" : "Siguiente paso");
  return parts.join("\n");
}

async function main(): Promise<void> {
  const app = document.getElementById("app")!;
  const [tour, content, notesFile] = await Promise.all([
    json<TourData>("data/tour.json"),
    json<ContentData>("data/content.json"),
    json<{ chapters: Record<string, Notes> }>("data/notes.json"),
  ]);
  const { steps } = buildSteps(tour, content, BUBBLE_SPECS);
  const chapters: Chapter[] = buildChapters(tour);
  const chapterOf = (step: Step): Chapter => chapters.find((c) => parseInt(tour.segments[step.seg].scene, 10) === c.number)!;

  app.innerHTML = `
    <header class="top">
      <img class="logo" src="logo.svg" alt="Bodega de Licores" />
      <h1>Vista del presentador</h1>
      <span class="conn" data-conn>● Esperando la ventana de la presentación…</span>
      <div class="clocks">
        <div class="clock" data-total><small>Total</small><b>00:00</b><span>/ 14:00</span></div>
        <div class="clock" data-scene><small>Esta escena</small><b>00:00</b><span>/ 00:00</span></div>
      </div>
    </header>

    <main class="grid">
      <section class="col main">
        <div class="now">
          <p class="eyebrow" data-eyebrow></p>
          <h2 data-title></h2>
          <p class="onscreen" data-onscreen></p>
        </div>
        <div class="box ideas"><h3>Ideas clave</h3><ul data-ideas></ul></div>
        <div class="two">
          <div class="box data"><h3>Datos que puedes citar</h3><ul data-data></ul></div>
          <div class="box avoid"><h3>No digas</h3><ul data-avoid></ul></div>
        </div>
        <div class="box handoff"><h3>Relevo</h3><p data-handoff></p></div>
      </section>

      <aside class="col side">
        <div class="box next"><h3>Lo que viene</h3><p data-next></p></div>
        <div class="box steps"><h3>Pasos de la escena</h3><ol data-steps></ol></div>
        <div class="box scenes"><h3>Escenas</h3><ol data-scenes></ol></div>
      </aside>
    </main>

    <footer class="controls">
      <button data-cmd="prevScene" title="Escena anterior (Shift + ←)">⏮ Escena</button>
      <button data-cmd="prev" class="big" title="Paso anterior (←)">‹ Anterior</button>
      <button data-cmd="next" class="big primary" title="Siguiente paso (→ o Espacio)">Siguiente ›</button>
      <button data-cmd="nextScene" title="Escena siguiente (Shift + →)">Escena ⏭</button>
      <span class="spacer"></span>
      <button data-cmd="toggleMode" class="mode" title="Paso a paso o automático (M)">Paso a paso</button>
    </footer>`;

  const q = <T extends HTMLElement>(sel: string): T => app.querySelector<T>(sel)!;
  const conn = q("[data-conn]");
  const chan = openChannel();
  let state: StateMsg | null = null;
  let lastSeen = 0;

  const send = (cmd: Cmd, index?: number) => chan.postMessage({ type: "cmd", cmd, index } satisfies Msg);

  app.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cmd],[data-step],[data-scene]");
    if (!el) return;
    if (el.dataset.cmd) send(el.dataset.cmd as Cmd);
    else if (el.dataset.step) send("goStep", Number(el.dataset.step));
    else if (el.dataset.scene) {
      const first = steps.findIndex((s) => parseInt(tour.segments[s.seg].scene, 10) === Number(el.dataset.scene));
      send("goStep", first);
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") (e.preventDefault(), send(e.shiftKey ? "nextScene" : "next"));
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") (e.preventDefault(), send(e.shiftKey ? "prevScene" : "prev"));
    else if (k === " " || k === "Enter") (e.preventDefault(), send(state?.started ? "next" : "start"));
    else if (k === "m" || k === "M") send("toggleMode");
  });

  function render(): void {
    const live = Date.now() - lastSeen < 2500;
    conn.textContent = !state ? "● Esperando la ventana de la presentación…" : live ? "● Conectado" : "● Sin señal de la presentación";
    conn.className = `conn ${state && live ? "ok" : "off"}`;
    if (!state) return;

    const step = steps[state.stepIndex] ?? steps[0];
    const chapter = chapterOf(step);
    const notes = notesFile.chapters[String(chapter.number)];
    const budget = chapter.end - chapter.start;
    const inScene = steps.filter((s) => chapterOf(s) === chapter);
    const idxInScene = inScene.indexOf(step);

    // relojes
    const total = q("[data-total]");
    q<HTMLElement>("[data-total] b").textContent = clock(state.started ? state.elapsed : 0);
    total.classList.toggle("warn", state.elapsed >= 12.5 * 60);
    total.classList.toggle("over", state.elapsed >= 14 * 60);
    const sc = q("[data-scene]");
    q<HTMLElement>("[data-scene] b").textContent = clock(state.started ? state.sceneElapsed : 0);
    q<HTMLElement>("[data-scene] span").textContent = `/ ${clock(budget)}`;
    sc.classList.toggle("warn", state.sceneElapsed > budget);
    sc.classList.toggle("over", state.sceneElapsed > budget * 1.25);

    q("[data-eyebrow]").textContent = `Escena ${chapter.number} de ${chapters.length} · paso ${idxInScene + 1} de ${inScene.length}`;
    q("[data-title]").innerHTML = `${esc(chapter.title)} <em>${esc(chapter.speaker)}</em>`;
    q("[data-onscreen]").textContent = state.started ? `En pantalla: ${describeStep(step).replace(/\n/g, " · ")}` : "La presentación aún no empieza: pulsa Siguiente para iniciarla.";

    q("[data-ideas]").innerHTML = (notes?.ideas ?? []).map((t) => `<li>${esc(t)}</li>`).join("");
    q("[data-data]").innerHTML = (notes?.data ?? []).map((t) => `<li>${esc(t)}</li>`).join("") || "<li class='none'>—</li>";
    q("[data-avoid]").innerHTML = (notes?.avoid ?? []).map((t) => `<li>${esc(t)}</li>`).join("");
    q("[data-handoff]").textContent = notes?.handoff ?? "";

    const next = steps[state.stepIndex + 1];
    const nextChapter = next ? chapterOf(next) : null;
    q("[data-next]").innerHTML =
      (next ? esc(describeStep(next)).replace(/\n/g, "<br>") : "Fin de la presentación") +
      (nextChapter && nextChapter !== chapter ? `<span class="switch">Cambia de escena → ${esc(nextChapter.title)} · ${esc(nextChapter.speaker)}</span>` : "");

    q("[data-steps]").innerHTML = inScene
      .map((s, i) => {
        const abs = steps.indexOf(s);
        const label = s.label ?? (s.arrival ? "La cámara llega a la estación" : "Paso");
        return `<li data-step="${abs}" class="${i === idxInScene ? "cur" : i < idxInScene ? "done" : ""}"><span>${i + 1}</span>${esc(label)}</li>`;
      })
      .join("");

    q("[data-scenes]").innerHTML = chapters
      .map((c) => `<li data-scene="${c.number}" class="${c === chapter ? "cur" : c.number < chapter.number ? "done" : ""}"><b>${c.number}</b><span>${esc(c.title)}<em>${esc(c.speaker)}</em></span><i>${clock(c.end - c.start)}</i></li>`)
      .join("");

    q<HTMLElement>(".mode").textContent = state.auto ? "Automático" : "Paso a paso";
  }

  chan.onmessage = (ev: MessageEvent<Msg>) => {
    if (ev.data.type !== "state") return;
    state = ev.data;
    lastSeen = Date.now();
    render();
  };
  chan.postMessage({ type: "hello" } satisfies Msg);
  window.setInterval(() => {
    render();
    if (!state || Date.now() - lastSeen > 2500) chan.postMessage({ type: "hello" } satisfies Msg);
  }, 1000);
  render();
}

main().catch((err) => {
  document.body.insertAdjacentHTML("beforeend", `<pre style="color:#fff;padding:20px">${String(err)}</pre>`);
  console.error(err);
});
