import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "./style.css";
import { Stage } from "./stage";
import { Tour } from "./tour";
import { Bubbles } from "./bubbles";
import { BUBBLE_SPECS } from "./bubbleSpecs";
import { Overlay } from "./overlay";
import { buildChapters, buildSteps } from "./steps";
import { openChannel, type Msg, type StateMsg } from "./sync";
import type { ContentData, TourData } from "./types";

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

async function main(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const [tourData, content] = await Promise.all([json<TourData>("data/tour.json"), json<ContentData>("data/content.json")]);

  const stage = new Stage(document.getElementById("stage") as HTMLCanvasElement);
  const tour = new Tour(tourData);
  const { steps, bubbles: bubbleSpecs } = buildSteps(tourData, content, BUBBLE_SPECS);
  tour.steps = steps;
  const chapters = buildChapters(tourData);

  const root = await stage.loadModel("models/diorama.glb");
  await stage.applyScreenOverrides(root);
  const bubbles = new Bubbles(stage.scene, bubbleSpecs, tourData.spacing);

  // cronómetro real de la presentación (los 14 minutos de la sala)
  let startedAt = 0;
  const elapsed = (): number => (startedAt ? (performance.now() - startedAt) / 1000 : 0);

  const begin = (auto: boolean) => {
    overlay.hideStart();
    tour.auto = auto;
    tour.playing = auto;
    startedAt = performance.now();
  };
  const toggleMode = () => {
    tour.auto = !tour.auto;
    tour.playing = tour.auto;
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };
  const next = () => tour.next();
  const prev = () => tour.prev();
  const openPresenter = () => window.open("presenter.html", "bodega-presentador", "popup,width=1180,height=840");

  const overlay = new Overlay(document.getElementById("overlay")!, tourData, content, chapters, {
    onStartManual: () => begin(false),
    onStartAuto: () => begin(true),
    onNext: next,
    onPrev: prev,
    onChapter: (firstSeg) => {
      const i = tour.steps.findIndex((s) => s.seg === firstSeg);
      tour.seek(tour.steps[i].t);
    },
    onToggleMode: toggleMode,
    onTogglePlay: () => (tour.playing = !tour.playing),
    onFullscreen: fullscreen,
    onPresenter: openPresenter,
  });

  // ---- vista del presentador: otra ventana del mismo origen, sincronizada por BroadcastChannel ----
  const chan = openChannel();
  let sceneNumber = -1;
  let sceneStartedAt = performance.now();
  let lastSent = "";
  let lastSentAt = 0;
  const stateMsg = (): StateMsg => ({
    type: "state",
    started: overlay.started,
    auto: tour.auto,
    playing: tour.playing,
    time: tour.time,
    stepIndex: tour.stepIndex,
    elapsed: elapsed(),
    sceneElapsed: (performance.now() - sceneStartedAt) / 1000,
  });
  const broadcast = (force = false) => {
    const msg = stateMsg();
    const sig = `${msg.started}|${msg.auto}|${msg.playing}|${msg.stepIndex}`;
    const now = performance.now();
    if (force || sig !== lastSent || now - lastSentAt > 500) {
      chan.postMessage(msg);
      lastSent = sig;
      lastSentAt = now;
    }
  };
  chan.onmessage = (ev: MessageEvent<Msg>) => {
    const msg = ev.data;
    if (msg.type === "hello") return broadcast(true);
    if (msg.type !== "cmd") return;
    switch (msg.cmd) {
      case "start":
        if (!overlay.started) begin(false);
        break;
      case "next":
        if (!overlay.started) begin(false);
        else next();
        break;
      case "prev":
        prev();
        break;
      case "nextScene":
        tour.jumpScene(1);
        break;
      case "prevScene":
        tour.jumpScene(-1);
        break;
      case "toggleMode":
        toggleMode();
        break;
      case "goStep":
        if (msg.index !== undefined) tour.goStep(msg.index);
        break;
    }
  };

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // en un botón enfocado, Espacio/Enter lo activan; las demás teclas siguen funcionando
    if (e.target instanceof HTMLButtonElement && (e.key === " " || e.key === "Enter")) return;
    const key = e.key;
    if (!overlay.started) {
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        begin(false);
      }
      if (key === "h" || key === "H") overlay.toggleHelp();
      return;
    }
    switch (key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        e.preventDefault();
        if (e.shiftKey) tour.jumpScene(1);
        else next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
      case "Backspace":
        e.preventDefault();
        if (e.shiftKey) tour.jumpScene(-1);
        else prev();
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        if (tour.auto) tour.playing = !tour.playing;
        else next();
        break;
      case "Home":
        tour.goToStart();
        break;
      case "m":
      case "M":
        toggleMode();
        break;
      case "t":
      case "T":
        overlay.toggleTimer();
        break;
      case "a":
      case "A":
        overlay.toggleLargeText();
        break;
      case "f":
      case "F":
        fullscreen();
        break;
      case "h":
      case "H":
      case "?":
        overlay.toggleHelp();
        break;
      case "p":
      case "P":
        openPresenter();
        break;
      case "Escape":
        overlay.toggleHelp(false);
        tour.playing = false;
        break;
    }
  });

  // los controles se esconden solos para no ensuciar la proyección
  let idleTimer = 0;
  const wake = () => {
    document.body.classList.remove("idle");
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (overlay.started) document.body.classList.add("idle");
    }, 2800);
  };
  for (const ev of ["mousemove", "mousedown", "touchstart", "keydown"]) window.addEventListener(ev, wake, { passive: true });
  wake();

  // Parámetros para ensayar: ?t=300 · ?autoplay=1 · ?mode=auto · ?pause=1 · ?large=1 · ?timer=1
  if (params.has("t")) tour.seek(Number(params.get("t")));
  if (params.get("autoplay") === "1" || params.get("mode") === "auto") {
    begin(params.get("mode") === "auto");
    if (params.get("pause") === "1") tour.playing = false;
  }
  if (params.get("large") === "1") overlay.toggleLargeText(true);
  if (params.get("timer") === "1") overlay.showTimer();

  /** Lógica de la presentación: se separa del dibujo para seguir funcionando si la ventana queda oculta. */
  const advance = (dt: number) => {
    tour.update(dt);
    const chapterNow = parseInt(tour.segment.scene, 10);
    if (chapterNow !== sceneNumber) {
      sceneNumber = chapterNow;
      sceneStartedAt = performance.now();
    }
    broadcast();
  };
  let last = performance.now();
  // un navegador pausa requestAnimationFrame en ventanas ocultas: este temporizador mantiene el reloj y la sincronización
  window.setInterval(() => {
    if (!document.hidden) return;
    const now = performance.now();
    advance(Math.min(3, (now - last) / 1000));
    last = now;
  }, 200);
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    advance(dt);
    const { pos, aim } = tour.pose();
    stage.camera.position.copy(pos);
    stage.camera.lookAt(aim);
    stage.followLight(aim);
    bubbles.update(tour.time);
    const { index, total } = tour.stepsInChapter();
    overlay.update({
      step: tour.step,
      segIndex: tour.segmentIndex,
      stepInSeg: index,
      stepsInSeg: total,
      time: tour.time,
      auto: tour.auto,
      playing: tour.playing,
      elapsed: elapsed(),
    });
    stage.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main().catch((err) => {
  document.body.insertAdjacentHTML("beforeend", `<pre style="position:fixed;inset:20px;color:#fff;z-index:9">${String(err)}</pre>`);
  console.error(err);
});
