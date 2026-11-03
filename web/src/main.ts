import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./style.css";
import * as THREE from "three";
import { Stage, type Quality } from "./stage";
import { People } from "./people";
import { Decor } from "./decor";
import { Tour } from "./tour";
import { Bubbles } from "./bubbles";
import { BUBBLE_SPECS } from "./bubbleSpecs";
import { Overlay, type Cover } from "./overlay";
import { MapIntro, type MapCfg } from "./mapintro";
import { buildChapters, buildSteps } from "./steps";
import { Link, readToken, type Msg, type StateMsg } from "./sync";
import type { ContentData, TourData } from "./types";

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

/** Portada opcional: public/portada/cover.json (o la carpeta que se monta en Docker). */
async function loadCover(): Promise<Cover | null> {
  try {
    const c = await json<{ image?: string; title?: string; subtitle?: string; team?: string[]; meta?: string[] }>("portada/cover.json");
    return { ...c, image: c.image ? `portada/${c.image}` : undefined };
  } catch {
    return null;
  }
}

const frame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));

async function main(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const token = readToken();
  const [tourData, content, cover] = await Promise.all([json<TourData>("data/tour.json"), json<ContentData>("data/content.json"), loadCover()]);

  const stage = new Stage(document.getElementById("stage") as HTMLCanvasElement);
  // calidad: ?quality=high|low, o la que se eligió con Q la última vez; si no hay, se mide al empezar
  const QUALITY_KEY = "bodega-quality";
  let storedQuality: string | null = null;
  try {
    storedQuality = localStorage.getItem(QUALITY_KEY);
  } catch {
    /* sin almacenamiento: se mide */
  }
  const fixedQuality = params.get("quality") ?? storedQuality;
  if (fixedQuality === "low" || fixedQuality === "high") stage.setQuality(fixedQuality);
  const setQuality = (q: Quality, remember: boolean) => {
    stage.setQuality(q);
    decor.setQuality(q === "high");
    if (!remember) return;
    try {
      localStorage.setItem(QUALITY_KEY, q);
    } catch {
      /* no se recuerda, pero funciona */
    }
  };
  const tour = new Tour(tourData);
  const { steps, bubbles: bubbleSpecs } = buildSteps(tourData, content, BUBBLE_SPECS);
  tour.steps = steps;
  const chapters = buildChapters(tourData);

  // cronómetro real de la presentación (los 14 minutos de la sala): solo se ve en la vista del presentador
  let startedAt = 0;
  const elapsed = (): number => (startedAt ? (performance.now() - startedAt) / 1000 : 0);

  const link = new Link(token, "main");
  const presenterUrl = (): string => `presenter.html${token ? `?k=${encodeURIComponent(token)}` : ""}`;
  const openPresenter = () => {
    const w = window.open(presenterUrl(), "bodega-presentador", "popup,width=1180,height=840");
    if (!w) overlay.toast("El navegador bloqueó la ventana. Permite las ventanas emergentes o abre presenter.html en otra pestaña.");
  };
  const openAbout = () => window.open("acerca.html", "_blank");

  /** Portada → telón → inicio. Todo inicio (botón, teclado, celular) pasa por aquí. */
  const startShow = (auto: boolean) => overlay.playIntro(() => begin(auto));
  const begin = (auto: boolean, withMap = true) => {
    overlay.hideStart();
    tour.auto = auto;
    startedAt = performance.now();
    if (map && withMap) {
      // intro con mapa: el recorrido espera a que el mapa se disuelva en el render de la tienda
      tour.playing = false;
      map.start(auto, () => {
        overlay.skipTitleDelay();
        tour.playing = tour.auto;
      });
    } else tour.playing = auto;
  };
  const toggleMode = () => {
    tour.auto = !tour.auto;
    tour.playing = tour.auto;
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };
  const next = () => (map?.active ? map.advance() : tour.next());
  const prev = () => {
    if (!map?.active) tour.prev();
  };

  const overlay = new Overlay(
    document.getElementById("overlay")!,
    tourData,
    chapters,
    {
      onStartManual: () => startShow(false),
      onStartAuto: () => startShow(true),
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
      onAbout: openAbout,
    },
    cover,
  );
  const demo = content.segments.cierre?.video;
  if (demo) overlay.setDemo(demo);
  const mapCfg = await json<MapCfg>("data/map.json").catch(() => null);
  const map = mapCfg ? new MapIntro(document.getElementById("overlay")!, mapCfg) : null;

  // ---- precarga: modelo, imágenes, QR, shaders y texturas, para que nada se trabe durante la presentación ----
  overlay.setProgress(0.04);
  const root = await stage.loadModel("models/diorama.glb");
  await stage.applyScreenOverrides(root);
  const people = new People();
  // si faltan los personajes, se quedan los maniquíes del modelo
  await people.load(root).catch((err: unknown) => console.warn("Personajes:", err));
  const decor = new Decor(stage.scene, root);
  decor.setQuality(stage.quality === "high");
  const bubbles = new Bubbles(stage.scene, bubbleSpecs, tourData.spacing);
  overlay.setProgress(0.3);

  const images = new Set<string>();
  for (const s of steps) {
    if (s.card?.image) images.add(s.card.image);
    s.card?.logos?.forEach((l) => images.add(l.src));
  }
  const focusNames = new Set(steps.map((s) => s.focus).filter((f): f is string => Boolean(f)));
  const warmPoses = [
    ...tourData.keys.map((k) => ({ pos: new THREE.Vector3(k.pos[0], k.pos[2], -k.pos[1]), aim: new THREE.Vector3(k.aim[0], k.aim[2], -k.aim[1]) })),
    ...[...focusNames].flatMap((n) => {
      const f = stage.focusPose(root, n);
      return f ? [f] : [];
    }),
  ];
  if (map) await map.preload((d, t) => overlay.setProgress(0.3 + (0.1 * d) / t));
  const totalWork = images.size + warmPoses.length + 1;
  let done = 0;
  const tick = () => overlay.setProgress(0.4 + (0.6 * ++done) / totalWork);
  await document.fonts.ready;
  for (const src of images) {
    const img = new Image();
    img.src = src;
    await img.decode().catch(() => undefined);
    tick();
  }
  stage.renderer.compile(stage.scene, stage.camera);
  bubbles.warm();
  for (const p of warmPoses) {
    stage.warm(p.pos, p.aim);
    await frame();
    tick();
  }
  bubbles.update(0);
  overlay.setProgress(1);
  overlay.setReady();

  // ---- acercamiento de cámara a una pantalla del modelo ----
  let focusName: string | null = null;
  let focusBlend = 0;
  const focusCache = new Map<string, { pos: THREE.Vector3; aim: THREE.Vector3 } | null>();
  const focusPoseOf = (name: string) => {
    if (!focusCache.has(name)) focusCache.set(name, stage.focusPose(root, name));
    return focusCache.get(name) ?? null;
  };
  window.addEventListener("resize", () => focusCache.clear());

  // ---- vista del presentador y celular ----
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
      link.send(msg);
      lastSent = sig;
      lastSentAt = now;
    }
  };
  link.onStatus((connected) => {
    if (connected) broadcast(true);
  });
  link.onMessage((msg: Msg) => {
    if (msg.type === "hello") return broadcast(true);
    if (msg.type !== "cmd") return;
    if (map?.active && !["next", "toggleMode", "resetTimer", "start"].includes(msg.cmd)) return;
    switch (msg.cmd) {
      case "start":
        if (!overlay.started) startShow(false);
        break;
      case "next":
        if (!overlay.started) startShow(false);
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
      case "resetTimer":
        startedAt = performance.now();
        break;
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // en un botón enfocado, Espacio/Enter lo activan; las demás teclas siguen funcionando
    if (e.target instanceof HTMLButtonElement && (e.key === " " || e.key === "Enter")) return;
    const key = e.key;
    if (!overlay.started) {
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        if (!document.querySelector<HTMLButtonElement>('[data-act="start-manual"]')!.disabled) startShow(false);
      }
      if (key === "h" || key === "H") overlay.toggleHelp();
      return;
    }
    switch (key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        e.preventDefault();
        if (e.shiftKey) {
          if (!map?.active) tour.jumpScene(1);
        } else next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
      case "Backspace":
        e.preventDefault();
        if (e.shiftKey) {
          if (!map?.active) tour.jumpScene(-1);
        } else prev();
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        if (tour.auto) tour.playing = !tour.playing;
        else next();
        break;
      case "Home":
        if (!map?.active) tour.goToStart();
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
      case "i":
      case "I":
        openAbout();
        break;
      case "q":
      case "Q":
        setQuality(stage.quality === "high" ? "low" : "high", true);
        overlay.toast(stage.quality === "high" ? "Calidad alta: luz de estudio y efectos" : "Calidad básica: más fluida en equipos lentos");
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
    overlay.skipIntro();
    begin(params.get("mode") === "auto", params.get("map") === "1");
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
  // si el equipo no mueve los efectos a 30 fps en los primeros segundos, se bajan una sola vez
  let fpsCheck = fixedQuality === "low" || fixedQuality === "high" ? -1 : 0;
  let fpsFrames = 0;
  const checkFps = (realDt: number) => {
    if (fpsCheck < 0 || !overlay.started || document.hidden || realDt > 0.5) return;
    fpsCheck += realDt;
    fpsFrames++;
    if (fpsCheck < 4) return;
    if (fpsFrames / fpsCheck < 30 && stage.quality === "high") {
      setQuality("low", false);
      overlay.toast("Bajé los efectos para que se mueva fluido (Q para cambiar)");
    }
    fpsCheck = -1;
  };
  // un navegador pausa requestAnimationFrame en ventanas ocultas: este temporizador mantiene el reloj y la sincronización
  window.setInterval(() => {
    if (!document.hidden) return;
    const now = performance.now();
    advance(Math.min(3, (now - last) / 1000));
    last = now;
  }, 200);

  const loop = (now: number) => {
    checkFps((now - last) / 1000);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    advance(dt);

    // cámara: recorrido + acercamiento a la pantalla del paso actual
    const base = tour.pose();
    const want = tour.step.focus ?? null;
    if (want) focusName = want;
    focusBlend += ((want ? 1 : 0) - focusBlend) * (1 - Math.exp(-dt * 3.2));
    if (!want && focusBlend < 0.003) focusName = null;
    const f = focusName ? focusPoseOf(focusName) : null;
    const e = focusBlend * focusBlend * (3 - 2 * focusBlend);
    const pos = f ? base.pos.clone().lerp(f.pos, e) : base.pos;
    const aim = f ? base.aim.clone().lerp(f.aim, e) : base.aim;
    stage.camera.position.copy(pos);
    stage.camera.lookAt(aim);
    stage.followLight(aim);

    bubbles.update(tour.time);
    people.update(dt);
    decor.update(aim);
    const { index, total } = tour.stepsInChapter();
    if (!map?.active) overlay.update({
      step: tour.step,
      segIndex: tour.segmentIndex,
      stepInSeg: index,
      stepsInSeg: total,
      time: tour.time,
      auto: tour.auto,
      playing: tour.playing,
      elapsed: elapsed(),
    });
    stage.render(e);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

main().catch((err) => {
  document.body.insertAdjacentHTML("beforeend", `<pre style="position:fixed;inset:20px;color:#fff;z-index:9">${String(err)}</pre>`);
  console.error(err);
});
