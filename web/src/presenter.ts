import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/playfair-display/700.css";
import "./presenter.css";
import QRCode from "qrcode";
import { BUBBLE_SPECS } from "./bubbleSpecs";
import { buildChapters, buildSteps } from "./steps";
import { Link, readToken, type Cmd, type Msg, type StateMsg } from "./sync";
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
  if (s.focus) parts.push("La cámara se acerca a la pantalla");
  if (!parts.length) parts.push(s.arrival ? "La cámara llega a la estación" : "Siguiente paso");
  return parts.join("\n");
}

async function main(): Promise<void> {
  const app = document.getElementById("app")!;
  const token = readToken();
  const isRemote = location.pathname.replace(/\/$/, "").endsWith("/remote") || new URLSearchParams(location.search).has("remote");
  document.body.classList.toggle("remote", isRemote);

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
      <h1>${isRemote ? "Control remoto" : "Vista del presentador"}</h1>
      <span class="conn" data-conn>● Esperando la presentación…</span>
      <div class="clocks">
        <div class="clock" data-total><small>Total</small><b>00:00</b><span>/ 14:00</span></div>
        <div class="clock" data-scene><small>Escena</small><b>00:00</b><span>/ 00:00</span></div>
      </div>
    </header>

    <main class="grid">
      <section class="col main">
        <div class="now">
          <p class="eyebrow" data-eyebrow></p>
          <h2 data-title></h2>
          <p class="onscreen" data-onscreen></p>
        </div>
        <details class="box ideas" open><summary>Ideas clave</summary><ul data-ideas></ul></details>
        <div class="two">
          <details class="box data" ${isRemote ? "" : "open"}><summary>Datos que puedes citar</summary><ul data-data></ul></details>
          <details class="box avoid" ${isRemote ? "" : "open"}><summary>No digas</summary><ul data-avoid></ul></details>
        </div>
        <div class="box handoff"><h3>Relevo</h3><p data-handoff></p></div>
      </section>

      <aside class="col side">
        <div class="box next"><h3>Lo que viene</h3><p data-next></p></div>
        <details class="box steps" ${isRemote ? "" : "open"}><summary>Pasos de la escena</summary><ol data-steps></ol></details>
        <details class="box scenes" ${isRemote ? "" : "open"}><summary>Escenas</summary><ol data-scenes></ol></details>
        <details class="box phone" ${isRemote ? "hidden" : ""}>
          <summary>Controlar desde el celular</summary>
          <div class="phone-body">
            <img data-qr alt="QR del control remoto" />
            <div>
              <p class="small" data-phone-msg></p>
              <label class="small">Dirección de este equipo en la red
                <input data-host placeholder="http://192.168.1.20:8080" />
              </label>
            </div>
          </div>
        </details>
      </aside>
    </main>

    <footer class="controls">
      <button data-cmd="prevScene" class="small-btn" title="Escena anterior (Shift + ←)">⏮</button>
      <button data-cmd="prev" class="big" title="Paso anterior (←)">‹ Atrás</button>
      <button data-cmd="next" class="big primary" title="Siguiente paso (→ o Espacio)">Siguiente ›</button>
      <button data-cmd="nextScene" class="small-btn" title="Escena siguiente (Shift + →)">⏭</button>
      <span class="spacer"></span>
      <button data-cmd="toggleMode" class="mode" title="Paso a paso o automático (M)">Paso a paso</button>
      <button data-cmd="resetTimer" class="mode" title="Reiniciar el cronómetro total">↺ Reloj</button>
    </footer>`;

  const q = <T extends HTMLElement>(sel: string): T => app.querySelector<T>(sel)!;
  const conn = q("[data-conn]");
  const link = new Link(token);
  let state: StateMsg | null = null;
  let lastSeen = 0;
  let remoteOk = false;

  const send = (cmd: Cmd, index?: number) => {
    navigator.vibrate?.(18);
    link.send({ type: "cmd", cmd, index });
  };

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
    if (e.ctrlKey || e.metaKey || e.altKey || e.target instanceof HTMLInputElement) return;
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") (e.preventDefault(), send(e.shiftKey ? "nextScene" : "next"));
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") (e.preventDefault(), send(e.shiftKey ? "prevScene" : "prev"));
    else if (k === " " || k === "Enter") (e.preventDefault(), send(state?.started ? "next" : "start"));
    else if (k === "m" || k === "M") send("toggleMode");
  });

  // ---- QR para conectar el celular (solo en la vista de escritorio) ----
  if (!isRemote) {
    const hostInput = q<HTMLInputElement>("[data-host]");
    const qrImg = q<HTMLImageElement>("[data-qr]");
    const msg = q("[data-phone-msg]");
    const saved = localStorage.getItem("bodega-host");
    let publicUrl = saved ?? "";
    try {
      if (!publicUrl) {
        const info = await json<{ publicUrl?: string }>("api/info");
        publicUrl = info.publicUrl ?? "";
      }
    } catch {
      /* servidor de desarrollo: sin /api/info */
    }
    hostInput.value = publicUrl || location.origin;
    const drawQr = async () => {
      const base = hostInput.value.replace(/\/$/, "");
      if (!token) {
        msg.textContent = "Para usar el celular abre la presentación con ?k=TOKEN (lo imprime start.sh).";
        qrImg.removeAttribute("src");
        return;
      }
      if (/localhost|127\.0\.0\.1/.test(base)) {
        msg.textContent = "Escribe la dirección de este equipo en la red (no localhost) para que el celular pueda abrirla.";
      } else {
        msg.textContent = "Escanéalo con el celular (misma red Wi-Fi). Para usarlo sin pasar por el escáner, abre /remote?k=…";
      }
      qrImg.src = await QRCode.toDataURL(`${base}/remote?k=${encodeURIComponent(token)}`, { margin: 1, width: 360, color: { dark: "#2b2020", light: "#ffffff" } });
    };
    hostInput.addEventListener("change", () => {
      localStorage.setItem("bodega-host", hostInput.value);
      void drawQr();
    });
    void drawQr();
  }

  // ---- el celular no debe apagar la pantalla mientras se presenta ----
  if (isRemote && "wakeLock" in navigator) {
    const lock = () => void navigator.wakeLock.request("screen").catch(() => undefined);
    lock();
    document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && lock());
  }

  function render(): void {
    const live = Date.now() - lastSeen < 2500;
    const via = remoteOk ? " (por red)" : "";
    conn.textContent = !state ? "● Esperando la presentación…" : live ? `● Conectado${via}` : "● Sin señal de la presentación";
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

  link.onMessage((m: Msg) => {
    if (m.type !== "state") return;
    state = m;
    lastSeen = Date.now();
    render();
  });
  link.onStatus((ok) => {
    remoteOk = ok;
    render();
  });
  link.send({ type: "hello" });
  window.setInterval(() => {
    render();
    if (!state || Date.now() - lastSeen > 2500) link.send({ type: "hello" });
  }, 1000);
  render();
}

main().catch((err) => {
  document.body.insertAdjacentHTML("beforeend", `<pre style="color:#fff;padding:20px">${String(err)}</pre>`);
  console.error(err);
});
