import "./style.css";
import { Stage } from "./stage";
import { Tour } from "./tour";
import { Bubbles, BUBBLE_SPECS } from "./bubbles";
import { Overlay } from "./overlay";
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
  const root = await stage.loadModel("models/diorama.glb");
  await stage.applyScreenOverrides(root);
  const bubbles = new Bubbles(stage.scene, BUBBLE_SPECS, tourData.spacing);

  const goTo = (i: number) => tour.goToSegment(i);
  const toggle = () => {
    if (!overlay.started) return;
    if (tour.time >= tour.duration) tour.seek(0);
    tour.playing = !tour.playing;
  };
  const begin = () => {
    overlay.hideStart();
    tour.playing = true;
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };

  const overlay = new Overlay(document.getElementById("overlay")!, tourData, content, {
    onStart: begin,
    onToggle: toggle,
    onPrev: () => goTo(tour.segmentIndex - (tour.time - tour.segment.start > 6 ? 0 : 1)),
    onNext: () => goTo(tour.segmentIndex + 1),
    onSeek: (t) => tour.seek(t),
    onFullscreen: fullscreen,
  });

  window.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === " " || e.key === "Enter")) return;
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        if (!overlay.started) begin();
        else toggle();
        break;
      case "Enter":
        if (!overlay.started) begin();
        break;
      case "ArrowRight":
        goTo(tour.segmentIndex + 1);
        break;
      case "ArrowLeft":
        goTo(tour.segmentIndex - (tour.time - tour.segment.start > 6 ? 0 : 1));
        break;
      case "f":
      case "F":
        fullscreen();
        break;
      case "a":
      case "A":
        overlay.toggleLargeText();
        break;
      case "Escape":
        tour.playing = false;
        break;
    }
  });

  // ?t=300 salta a ese segundo; ?autoplay=1 arranca sin pantalla de inicio (útil para ensayos y pruebas)
  if (params.has("t")) tour.seek(Number(params.get("t")));
  if (params.get("autoplay") === "1") {
    overlay.hideStart();
    tour.playing = params.get("pause") !== "1";
  }
  if (params.get("large") === "1") overlay.toggleLargeText(true);

  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    tour.update(dt);
    const { pos, aim } = tour.pose();
    stage.camera.position.copy(pos);
    stage.camera.lookAt(aim);
    stage.followLight(aim);
    bubbles.update(tour.time);
    overlay.update(tour.time, tour.segment, tour.playing);
    stage.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main().catch((err) => {
  document.body.insertAdjacentHTML("beforeend", `<pre style="position:fixed;inset:20px;color:#fff;z-index:9">${String(err)}</pre>`);
  console.error(err);
});
